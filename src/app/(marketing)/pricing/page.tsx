import { Check, Minus } from "lucide-react";
import { orderedPlans, pricingFeatures } from "@/lib/plans";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import React from "react";

export const metadata = { title: "Pricing | waitq" };

export default function PricingPage() {
  return (
    <main className="container mx-auto py-16 px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Plans that grow with your business
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px]">
          Start free and upgrade as you scale. No hidden fees.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20">
        {orderedPlans.map((plan) => {
          const isPopular = plan.id === "base";
          return (
            <Card
              key={plan.id}
              className={cn(
                "flex flex-col relative transition-all duration-300",
                isPopular
                  ? "border-primary shadow-lg scale-100 md:scale-105 z-10 bg-background overflow-visible"
                  : "bg-background/60 hover:bg-background/80"
              )}
            >
              {isPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="min-h-[40px]">
                  {plan.id === "free" &&
                    "Perfect for testing the waters and small establishments."}
                  {plan.id === "base" &&
                    "Essential features for growing busy restaurants."}
                  {plan.id === "premium" &&
                    "Unleash the full power with advanced analytics and support."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    €{plan.priceMonthlyEUR}
                  </span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-5 w-5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                  size="lg"
                >
                  <Link
                    href={
                      plan.id === "free"
                        ? "/login"
                        : `/subscriptions?plan=${plan.id}`
                    }
                  >
                    {plan.id === "free" ? "Get Started" : `Choose ${plan.name}`}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight">
            Compare all features
          </h2>
          <p className="text-muted-foreground mt-2">
            Detailed breakdown of what&apos;s included.
          </p>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Feature</TableHead>
                <TableHead className="text-center">Free</TableHead>
                <TableHead className="text-center text-primary font-bold">
                  Base
                </TableHead>
                <TableHead className="text-center">Premium</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(new Set(pricingFeatures.map((f) => f.category))).map(
                (category) => (
                  <React.Fragment key={category}>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell
                        colSpan={4}
                        className="font-semibold text-muted-foreground py-3"
                      >
                        {category}
                      </TableCell>
                    </TableRow>
                    {pricingFeatures
                      .filter((f) => f.category === category)
                      .map((feature, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            {feature.name}
                          </TableCell>
                          <TableCell className="text-center">
                            <FeatureValue value={feature.free} />
                          </TableCell>
                          <TableCell className="text-center">
                            <FeatureValue value={feature.base} isPrimary />
                          </TableCell>
                          <TableCell className="text-center">
                            <FeatureValue value={feature.premium} />
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
                )
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground italic">
          * Comparison based on current market standards and competitor offerings.
          SMS costs may vary.
        </div>
      </div>
    </main>
  );
}

function FeatureValue({
  value,
  isPrimary = false,
}: {
  value: boolean | string;
  isPrimary?: boolean;
}) {
  if (typeof value === "string") {
    return (
      <span
        className={cn(
          "text-sm font-medium",
          isPrimary && "text-primary font-bold"
        )}
      >
        {value}
      </span>
    );
  }

  if (value === true) {
    return (
      <div className="flex justify-center">
        <Check
          className={cn(
            "h-5 w-5",
            isPrimary ? "text-primary" : "text-muted-foreground"
          )}
        />
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <Minus className="h-5 w-5 text-muted-foreground/30" />
    </div>
  );
}
