import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createRouteClient();
    const { searchParams } = new URL(req.url);

    const period = searchParams.get('period') || 'month'; // 'month', 'week', 'day'
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get notification statistics
    const { data: stats, error: statsError } = await supabase
      .from('notification_logs')
      .select(`
        id,
        message_type,
        status,
        sent_at,
        delivered_at,
        cost_cents,
        created_at
      `)
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (statsError) {
      console.error('Error fetching notification stats:', statsError);
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }

    // Calculate summary statistics
    const summary = {
      total: stats.length,
      sms: {
        total: stats.filter(s => s.message_type === 'sms').length,
        sent: stats.filter(s => s.message_type === 'sms' && s.status === 'sent').length,
        delivered: stats.filter(s => s.message_type === 'sms' && s.status === 'delivered').length,
        failed: stats.filter(s => s.message_type === 'sms' && s.status === 'failed').length,
      },
      whatsapp: {
        total: stats.filter(s => s.message_type === 'whatsapp').length,
        sent: stats.filter(s => s.message_type === 'whatsapp' && s.status === 'sent').length,
        delivered: stats.filter(s => s.message_type === 'whatsapp' && s.status === 'delivered').length,
        failed: stats.filter(s => s.message_type === 'whatsapp' && s.status === 'failed').length,
      },
      costs: {
        total: stats.reduce((sum, s) => sum + (s.cost_cents || 0), 0),
        sms: stats.filter(s => s.message_type === 'sms').reduce((sum, s) => sum + (s.cost_cents || 0), 0),
        whatsapp: stats.filter(s => s.message_type === 'whatsapp').reduce((sum, s) => sum + (s.cost_cents || 0), 0),
      },
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };

    // Get monthly breakdown for charts
    const { data: monthlyStats, error: monthlyError } = await supabase
      .from('user_monthly_limits')
      .select('*')
      .eq('user_id', user.id)
      .order('month', { ascending: false })
      .limit(12);

    return NextResponse.json({
      summary,
      notifications: stats,
      monthlyBreakdown: monthlyStats || [],
      limits: {
        // You can add your business logic here for user limits
        smsPerMonth: 1000, // Example limit
        whatsappPerMonth: 500, // Example limit
        costPerMonth: 5000 // Example cost limit in cents
      }
    });

  } catch (error) {
    console.error('Error in notification stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
