import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, fontFamilies, fontSizes, spacing } from '@nova/ui-tokens'
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Price,
  Skeleton,
  StatusBadge,
  Stepper,
  TextField,
  useToast,
} from '../../src/ui'

function Section({ title, dark = false, children }: { title: string; dark?: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.section, dark && { backgroundColor: colors.driver.background }]}>
      <Text style={[styles.sectionTitle, dark && { color: colors.driver.text }]}>{title}</Text>
      {children}
    </View>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>
}

export default function CatalogueScreen() {
  const { show } = useToast()

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* ── MODE CLIENT ── */}
      <Section title="Mode Client — Boutons">
        <Row>
          <Button label="Commander" variant="primary" size="lg" />
        </Row>
        <Row>
          <Button label="Envoyer un colis" variant="parcel" size="lg" />
        </Row>
        <Row>
          <Button label="Secondaire" variant="secondary" size="md" />
          <Button label="Tertiaire" variant="tertiary" size="md" />
        </Row>
        <Row>
          <Button label="Supprimer" variant="destructive" size="sm" />
          <Button label="Désactivé" variant="primary" size="sm" disabled />
          <Button label="Chargement" variant="primary" size="sm" loading />
        </Row>
      </Section>

      <Section title="Champ texte">
        <TextField label="Numéro de téléphone" placeholder="+221 77 000 00 00" hint="Format international" />
        <TextField label="Avec erreur" placeholder="Saisir…" error="Ce champ est obligatoire." />
      </Section>

      <Section title="Cartes">
        <Card elevationLevel="sm">
          <Text style={styles.bodyText}>Carte simple (elevation sm)</Text>
        </Card>
        <Card elevationLevel="md" onPress={() => show('Carte pressée', 'info')}>
          <Text style={styles.bodyText}>Carte pressable (elevation md)</Text>
        </Card>
      </Section>

      <Section title="Badges de statut">
        <Row>
          <StatusBadge status="success" label="Livrée" />
          <StatusBadge status="warning" label="En attente" />
          <StatusBadge status="error" label="Échouée" />
        </Row>
        <Row>
          <StatusBadge status="info" label="En cours" />
          <StatusBadge status="pending" label="Assignation…" />
        </Row>
      </Section>

      <Section title="Chips">
        <Row>
          <Chip label="Repas" selected />
          <Chip label="Colis" />
          <Chip label="Avec × " onDismiss={() => {}} />
        </Row>
      </Section>

      <Section title="Stepper (suivi commande)">
        <Stepper
          steps={[
            { label: 'Confirmée' },
            { label: 'En préparation' },
            { label: 'En route' },
            { label: 'Livrée' },
          ]}
          currentStep={2}
        />
      </Section>

      <Section title="Prix">
        <Row>
          <Price amount={4500} size="sm" />
          <Price amount={4500} size="base" />
          <Price amount={4500} size="lg" />
          <Price amount={4500} size="xl" />
        </Row>
        <Price amount={12000} size="xl" />
      </Section>

      <Section title="Squelettes">
        <Skeleton height={20} />
        <Skeleton height={16} width="60%" />
        <Skeleton height={80} borderRadius={16} />
      </Section>

      <Section title="État vide">
        <EmptyState
          title="Aucune commande"
          subtitle="Vos commandes apparaîtront ici."
          actionLabel="Commander maintenant"
          onAction={() => show('Action déclenchée', 'success')}
        />
      </Section>

      <Section title="Toast">
        <Row>
          <Button label="Succès" variant="primary" size="sm" onPress={() => show('Commande confirmée !', 'success')} />
          <Button label="Erreur" variant="destructive" size="sm" onPress={() => show('Une erreur est survenue.', 'error')} />
        </Row>
        <Row>
          <Button label="Alerte" variant="secondary" size="sm" onPress={() => show('Vérifiez votre connexion.', 'warning')} />
          <Button label="Info" variant="tertiary" size="sm" onPress={() => show('Mise à jour disponible.', 'info', 'Annuler')} />
        </Row>
      </Section>

      {/* ── MODE LIVREUR ── */}
      <Section title="Mode Livreur — Boutons" dark>
        <Row>
          <Button label="Accepter la course" variant="primary" size="lg" />
        </Row>
        <Row>
          <Button label="Colis accepté" variant="parcel" size="lg" />
        </Row>
      </Section>

      <Section title="Mode Livreur — Statuts" dark>
        <Row>
          <StatusBadge status="success" label="En ligne" />
          <StatusBadge status="warning" label="BLOQUÉ_CAISSE" />
        </Row>
      </Section>

      <Section title="Mode Livreur — Stepper" dark>
        <Stepper
          steps={[{ label: 'Récupéré' }, { label: 'En route' }, { label: 'Livré' }]}
          currentStep={1}
        />
      </Section>

      <Section title="Mode Livreur — Prix" dark>
        <Price amount={2800} size="xl" color={colors.driver.text} />
      </Section>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface.base },
  content: { paddingBottom: 80 },
  section: {
    backgroundColor: colors.surface.base,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing[6],
    gap: spacing[3],
  },
  sectionTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.base,
    color: colors.text.secondary,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    alignItems: 'center',
  },
  bodyText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.text.primary,
  },
})
