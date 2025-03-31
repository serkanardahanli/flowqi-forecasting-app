# Instructies voor het verwijderen van authenticatie in de FlowQi app

Dit document bevat een stappenplan om alle authenticatie-gerelateerde code uit de FlowQi applicatie te verwijderen. Volg deze stappen om een versie van de app te maken die zonder inloggen werkt.

## Uitgevoerde wijzigingen

De volgende wijzigingen zijn al doorgevoerd:

1. Vervangen van de middleware om geen authenticatie-checks meer uit te voeren
2. Verwijderd alle imports van `createClientComponentClient` uit `@supabase/auth-helpers-nextjs`
3. Vervangen door imports van `getBrowserSupabaseClient` uit `@/app/lib/supabase`
4. Verwijderd alle code die afhankelijk was van user sessions en organization_id
5. Verwijderd de auth directory en gerelateerde pagina's
6. Aangepast de homepage om direct naar het dashboard te redirecten

## Nog uit te voeren acties voor volledige verwijdering van authenticatie

1. **Supabase Row Level Security (RLS) uitschakelen**

   Voer het bestand `disable_rls.sql` uit in je Supabase SQL Editor om Row Level Security uit te schakelen voor alle tabellen:

   ```sql
   -- Voer de inhoud van disable_rls.sql uit in je Supabase SQL Editor
   ```

2. **Verwijder auth-gerelateerde omgevingsvariabelen** (optioneel)

   Je kunt de volgende omgevingsvariabelen verwijderen uit je `.env` bestand als ze niet meer nodig zijn:

   ```
   # Auth-gerelateerde variabelen die kunnen worden verwijderd
   NEXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL=
   SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET=
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=
   ```

3. **Controleer op eventuele gemiste bestanden**

   Als je nog steeds problemen tegenkomt met ontbrekende auth-helpers, controleer dan op gemiste bestanden met:

   ```bash
   grep -r "createClientComponentClient" .
   grep -r "auth-helpers-nextjs" .
   grep -r "getOrganizationId" .
   grep -r "ensureClientUserProfile" .
   ```

4. **Update package.json** (optioneel)

   Verwijder de auth-gerelateerde dependencies uit package.json als ze nog aanwezig zijn:

   ```json
   {
     "dependencies": {
       // Verwijder deze regel als hij bestaat
       "@supabase/auth-helpers-nextjs": "x.x.x"
     }
   }
   ```

## Potentiële problemen

1. **Organization_id in database queries**

   Sommige queries kunnen nog steeds gefilterd zijn op organization_id. Deze filters moeten worden verwijderd of aangepast om alle data weer te geven.

2. **RLS in Supabase**

   Als je nog steeds problemen hebt met het ophalen van data, controleer dan of Row Level Security correct is uitgeschakeld in je Supabase database.

3. **API Routes**

   Als je custom API routes hebt die auth middleware gebruiken, moeten deze worden aangepast om zonder authenticatie te werken.

## Testen

Na het voltooien van bovenstaande stappen, test de applicatie door:

1. De applicatie te starten met `npm run dev`
2. Controleren of je direct naar het dashboard wordt omgeleid zonder inlogscherm
3. Controleren of alle pagina's correct laden en data weergeven
4. Verifiëren dat CRUD-operaties (create, read, update, delete) werken zonder authenticatie 