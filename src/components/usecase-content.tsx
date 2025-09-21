export default function UseCaseContent({ title }: { title: string }) {
  return (
    <main className="py-16">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <div className="mt-6 grid gap-4 text-sm text-neutral-700">
          <p className="text-neutral-900 font-medium">Trim Client Wait Time and Streamline Operations</p>
          <p>Let Your Clients Join the Waitlist Remotely</p>
          <p>Let your barber shop&apos;s clients add themselves to the waitlist from wherever they are, whether it&apos;s at home or using a tablet in your reception area. This convenience saves both you and your clients valuable time.</p>
          <p>Free Up Lobby Space</p>
          <p>Give clients the freedom to step out for a coffee or handle errands instead of waiting there in your shop. Keep them informed by sending a text message notification when it&apos;s their turn.</p>
          <p>Personalized Client Communication</p>
          <p>Automate and personalize two-way messaging throughout every client’s journey. Request inspiration images ahead of time, thank them for their visit, or ask for a review.</p>
          <p>Merge Walk-Ins and Appointments Seamlessly</p>
          <p>Automate and personalize two-way messaging throughout every client’s journey. Confirm and remind them of their appointment, thank them for their visit, or ask for a review.</p>
          <p>Enhanced Business Insights</p>
          <p>Gain valuable operational insights through user-friendly analytics, helping you identify and resolve operational challenges. Monitor average wait times, peak barber shop hours, employee performance, and more.</p>
        </div>
        <div className="mt-10">
          <h2 className="text-base font-semibold">The problems you may be facing</h2>
          <ul className="mt-3 list-disc pl-6 text-sm text-neutral-700">
            <li>Reception work and waiting management are cumbersome</li>
            <li>The burden of reception work</li>
            <li>I don&apos;t know the waiting time, it leads to dissatisfaction from customers</li>
            <li>The stress of waiting time</li>
            <li>There is a queue in front of the store, the waiting room is crowded</li>
            <li>Occurrence of waiting line</li>
          </ul>
        </div>
      </div>
    </main>
  );
}


