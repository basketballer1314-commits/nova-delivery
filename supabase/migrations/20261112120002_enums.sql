-- ============================================================
-- Nova Delivery — Migration 02 : Enums
-- ============================================================

-- Statuts commande repas
create type public.order_status as enum (
  'EN_ATTENTE_PAIEMENT', 'ENVOYEE_RESTAURANT', 'ACCEPTEE', 'RECHERCHE_LIVREUR',
  'LIVREUR_ASSIGNE', 'PRETE', 'RECUPEREE', 'ARRIVEE', 'LIVREE', 'TERMINEE',
  'REFUSEE', 'ANNULEE', 'ECHEC'
);

-- Statuts colis
create type public.parcel_status as enum (
  'DEVIS', 'CONFIRMEE', 'RECHERCHE_LIVREUR', 'LIVREUR_ASSIGNE', 'EN_ROUTE_RETRAIT',
  'ARRIVE_RETRAIT', 'RECUPERE', 'EN_ROUTE_LIVRAISON', 'ARRIVE', 'LIVRE',
  'TERMINE', 'ECHEC_LIVRAISON', 'RETOUR', 'RETOURNE', 'ANNULEE'
);

-- Statut de validation du livreur (valeurs par défaut — §14 non fourni)
create type public.courier_status as enum (
  'EN_ATTENTE', 'EN_REVUE', 'APPROUVE', 'REJETE', 'SUSPENDU'
);

-- Disponibilité du livreur
create type public.courier_availability as enum (
  'HORS_LIGNE', 'EN_LIGNE_LIBRE', 'EN_MISSION', 'BLOQUE_CAISSE'
);

-- Statut restaurant (valeurs par défaut — §14 non fourni)
create type public.restaurant_status as enum (
  'EN_ATTENTE', 'ACTIF', 'SUSPENDU', 'FERME', 'INACTIF'
);

-- Moyens de paiement
create type public.payment_method as enum ('cash', 'wave', 'orange_money');

-- Rôles applicatifs
create type public.app_role as enum (
  'client', 'courier', 'resto_owner', 'resto_staff',
  'admin_super', 'admin_ops', 'admin_finance', 'admin_support', 'admin_sales', 'admin_auditor'
);

-- Type de mission
create type public.delivery_job_type as enum ('food', 'parcel');
