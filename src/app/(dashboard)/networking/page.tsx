import { ContactsManager } from "@/components/networking/contacts-manager";
import { SuggestionCards } from "@/components/networking/suggestion-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContacts, getSuggestedContacts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NetworkingPage() {
  const [contacts, suggestions] = await Promise.all([getContacts(), getSuggestedContacts()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Networking</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your mini-CRM of people at AI companies — met or to contact — plus people the agent
          spots in each morning&apos;s news (public info only).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Suggested from the news</CardTitle>
        </CardHeader>
        <CardContent>
          <SuggestionCards suggestions={suggestions} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <ContactsManager contacts={contacts} />
        </CardContent>
      </Card>
    </div>
  );
}
