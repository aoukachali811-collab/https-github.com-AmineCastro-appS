
export type Page = 'dashboard' 
  | 'seed-needs' 
  | 'evaluation-program' 
  | 'fructification-evaluation' 
  | 'harvest-and-lots' 
  | 'seed-treatment'
  | 'quality-control' 
  | 'inventory' 
  | 'distribution'
  | 'species-management'
  | 'provenance-management'
  | 'region-management'
  | 'provider-management'
  | 'srs-management';

export interface SeedNeed {
    id: string;
    dranef: string;
    province: string;
    project: string;
    perimeterName: string;
    speciesId: string;
    numberOfPlants: number;
    calculatedSeedQuantityKg: number;
    requestDate: string;
    status: 'Nouveau' | 'Validé' | 'Traité';
}

export interface EvaluationProgram {
    id: string;
    speciesId: string;
    srsId: string;
    province: string;
    programmedDate: string;
    realDate?: string;
    status: 'Planifié' | 'En Cours' | 'Terminé';
}

export interface Species {
  id: string;
  scientificName: string;
  commonName: string;
  genus: string;
  group: string;
  seedingCoefficientKgPer1000Plants?: number;
}

export interface Region {
    id: string;
    code: string;
    name: string;
}

export interface Provenance {
  id: string;
  code: string;
  name: string;
  localisation: string;
  regionId: string;
  speciesId: string;
}

export interface Prestataire {
    id: string;
    name: string;
    address: string;
    phone: string;
}

export interface Srs {
    id: string;
    name: string;
    dranef: string;
    province: string;
}

export interface Lot {
  id: string;
  quantityKg: number;
  harvestYear: number;
  harvestDate: string;
  category: 'Récolte' | 'Achat';
  speciesId: string;
  provenanceId: string;
  seedStand: string;
  srsId: string;
  prestataireId?: string;
  status: 'En traitement' | 'En stock' | 'Distribué';
}

export interface SeedTreatment {
  id: string;
  lotId: string;
  treatmentType: 'Stratification à froid' | 'Scarification mécanique' | 'Trempage' | 'Traitement fongicide';
  startDate: string;
  endDate: string;
  operator: string;
  status: 'Planifié' | 'En cours' | 'Terminé';
  observations?: string;
}

export interface QualityCheck {
  id: string;
  lotId: string;
  checkType: 'Avant Conditionnement' | 'Après Conditionnement' | 'Périodique';
  date: string;
  germinationRate: number; // Taux de germination (TG)
  purity: number;
  moistureContent: number;
  thousandSeedWeight: number;
  result: 'Pass' | 'Fail';
}

export interface StockItem {
  id: string;
  lotId: string;
  speciesId: string;
  quantityKg: number;
  entryDate: string;
  srsId: string;
}

export interface FructificationEvaluation {
    id: string;
    programId: string;
    srsId: string;
    reportSummary: string;
    evaluationDate: string;
}

export interface Distribution {
    id: string;
    stockItemId: string;
    quantityKg: number;
    destination: string;
    distributionDate: string;
}


export interface MockData {
    species: Species[];
    regions: Region[];
    provenances: Provenance[];
    srs: Srs[];
    lots: Lot[];
    seedTreatments: SeedTreatment[];
    qualityChecks: QualityCheck[];
    stockItems: StockItem[];
    fructificationEvaluations: FructificationEvaluation[];
    seedNeeds: SeedNeed[];
    evaluationPrograms: EvaluationProgram[];
    prestataires: Prestataire[];
    distributions: Distribution[];
}