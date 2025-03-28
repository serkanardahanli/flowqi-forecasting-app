# Instructies voor het oplossen van RLS-problemen in FlowQi Forecasting App

Er zijn een aantal problemen gedetecteerd met de Row Level Security (RLS) in de Supabase database. Deze instructies helpen je om deze problemen op te lossen.

## Het probleem

1. **Oneindige recursie in de organization_users policy**: De huidige RLS-policy voor de `organization_users` tabel veroorzaakt een oneindige recursie omdat de policy zichzelf aanroept.

2. **Fout bij ophalen van organization_id**: Hierdoor kan de applicatie geen grootboekrekeningen ophalen of opslaan.

## De oplossing

Volg deze stappen om het probleem op te lossen:

### Stap 1: Voer de SQL-fix uit

1. Ga naar de [Supabase Dashboard](https://app.supabase.com) en log in
2. Selecteer je project
3. Ga naar de **SQL Editor**
4. Open het bestand `supabase/migrations/20240328_final_fix.sql` in je project
5. Kopieer de inhoud en plak deze in de SQL Editor
6. Voer de SQL uit door op de "Run" knop te klikken

Deze SQL-fix:
- Verwijdert alle problematische policies
- Creëert nieuwe, vereenvoudigde policies zonder oneindige recursies
- Zorgt ervoor dat gebruikers alleen toegang hebben tot hun eigen gegevens
- Herstelt de trigger voor het automatisch aanmaken van organisaties voor nieuwe gebruikers

### Stap 2: Start je applicatie opnieuw

1. Stop je Next.js applicatie als die draait
2. Start de applicatie opnieuw met `npm run dev`

### Stap 3: Log uit en weer in

1. Log uit van je account
2. Log weer in met je Google account

### Stap 4: Test de functionaliteit

Na het inloggen zou je het volgende moeten kunnen doen:
- Navigeren naar de GL Accounts pagina
- Grootboekrekeningen toevoegen
- Grootboekrekeningen bewerken en verwijderen

## Wat is er gewijzigd?

1. **Nieuwe RLS-policies**: We hebben de RLS-policies eenvoudiger gemaakt en de oneindige recursie verwijderd.
2. **Directe toegang via owner_id**: In plaats van indirecte relaties gebruiken we nu een directe eigenaarrelatie.
3. **Verbeterde foutafhandeling**: De frontend code is aangepast om beter met fouten om te gaan.

## Problemen oplossen

Als je nog steeds problemen ondervindt:

1. Controleer de browser console (F12) voor foutmeldingen
2. Controleer of je SQL-query succesvol is uitgevoerd
3. Zorg ervoor dat je bent uitgelogd en weer ingelogd

Als je nog steeds problemen hebt, neem dan contact op met de ontwikkelaar. 