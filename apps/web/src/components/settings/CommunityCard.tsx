import { LocalizedText } from "@/components/ui/LocalizedText";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@labas/ui/components/card";
import { CommunityChannelList } from "@/components/CommunityChannelList";

export function CommunityCard() {
  return (
    <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
      <CardHeader>
        <CardTitle className="font-headline text-[var(--clay-black)]"><LocalizedText source={"Komunitas"} /></CardTitle>
        <CardDescription className="text-[var(--warm-charcoal)]">
          <LocalizedText source={"WhatsApp untuk chat cepat; Discord untuk diskusi terstruktur (segera hadir)."} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CommunityChannelList variant="card" />
      </CardContent>
    </Card>
  );
}
