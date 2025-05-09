import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Rocket } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-background text-foreground">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Rocket className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold font-roboto tracking-tight">
            IPO Mad Racing
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <p className="text-lg text-center text-muted-foreground">
            Navigate the treacherous platforms, collect Spasibki, and race to the top!
          </p>
          <Link href="/play" passHref>
            <Button size="lg" className="w-full text-lg font-semibold">
              Start Playing
            </Button>
          </Link>
        </CardContent>
      </Card>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Firebase Studio. All rights reserved.</p>
      </footer>
    </main>
  );
}
