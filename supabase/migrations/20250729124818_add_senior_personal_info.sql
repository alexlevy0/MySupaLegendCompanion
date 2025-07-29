-- =====================================================
-- MIGRATION: Ajouter les informations personnelles aux seniors
-- Fichier: 20250729_add_senior_personal_info.sql
-- =====================================================

-- Ajouter les colonnes d'informations personnelles à la table seniors
ALTER TABLE public.seniors 
ADD COLUMN IF NOT EXISTS first_name character varying NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS last_name character varying NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS phone character varying UNIQUE;

-- Supprimer les contraintes DEFAULT temporaires après ajout
ALTER TABLE public.seniors 
ALTER COLUMN first_name DROP DEFAULT,
ALTER COLUMN last_name DROP DEFAULT;

-- Ajouter des index pour les performances
CREATE INDEX IF NOT EXISTS idx_seniors_phone ON public.seniors(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seniors_full_name ON public.seniors(first_name, last_name);

-- Ajouter des contraintes de validation
ALTER TABLE public.seniors 
ADD CONSTRAINT check_seniors_phone_format 
CHECK (phone IS NULL OR phone ~ '^(\+33|0)[1-9]([0-9]{8})$');

-- Commentaires pour documentation
COMMENT ON COLUMN public.seniors.first_name IS 'Prénom du senior';
COMMENT ON COLUMN public.seniors.last_name IS 'Nom de famille du senior';
COMMENT ON COLUMN public.seniors.phone IS 'Numéro de téléphone du senior (format français)';

-- Mettre à jour le trigger de timestamps (si nécessaire)
CREATE OR REPLACE FUNCTION handle_times()
    RETURNS trigger AS
    $$
    BEGIN
    IF (TG_OP = 'INSERT') THEN
        NEW.created_at := now();
        NEW.updated_at := now();
    ELSEIF (TG_OP = 'UPDATE') THEN
        NEW.created_at = OLD.created_at;
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
    END;
    $$ language plpgsql;

-- S'assurer que le trigger existe sur la table seniors
DROP TRIGGER IF EXISTS handle_times_seniors ON public.seniors;
CREATE TRIGGER handle_times_seniors
    BEFORE INSERT OR UPDATE ON public.seniors
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();