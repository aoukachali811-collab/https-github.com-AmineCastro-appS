
import { GoogleGenAI, Type } from "@google/genai";
import type { MockData, Species, Region, Provenance } from '../types';

// This is a placeholder. In a real environment, the API key would be set in the environment variables.
const FAKE_API_KEY = "mock_api_key_for_development";

// In a real application, you would use:
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
// For this example, we'll use a mocked implementation.

let cachedData: MockData | null = null;

const speciesList: Omit<Species, 'id' | 'genus' | 'group'>[] = [
    { scientificName: 'Eucalyptus woodwardii', commonName: 'Eucalyptus de Woodward' },
    { scientificName: 'Pinus brutia', commonName: 'Pin de Calabre' },
    { scientificName: 'Cassia sp.', commonName: 'Cassia' },
    { scientificName: 'Opuntia ficus-indica', commonName: 'Figuier de Barbarie' },
    { scientificName: 'Balanites aegyptiaca', commonName: 'Dattier du désert' },
    { scientificName: 'Nitraria retusa', commonName: 'Nitraria à feuilles rétuses' },
    { scientificName: 'Acacia horrida', commonName: 'Acacia horrida' },
    { scientificName: 'Eucalyptus cladocalyx', commonName: 'Gommier à fleurs' },
    { scientificName: 'Retama dasycarpa', commonName: 'Genêt à fruits velus' },
    { scientificName: 'Parkinsonia aculata', commonName: 'Palo Verde' },
    { scientificName: 'Schinus terebinthifolius', commonName: 'Faux-poivrier' },
    { scientificName: 'Lagunaria patersonii', commonName: 'Hibiscus de l\'île Norfolk' },
    { scientificName: 'Prosopis juliflora', commonName: 'Mesquite' },
    { scientificName: 'Tamarix aphylla', commonName: 'Tamaris articulé' },
    { scientificName: 'Prunus dulcis', commonName: 'Amandier' },
    { scientificName: 'Capparis spinosa', commonName: 'Câprier' },
    { scientificName: 'Eucalyptus rudis', commonName: 'Gommier des plaines inondables' },
    { scientificName: 'Lycium intricatum', commonName: 'Lyciet embrouillé' },
    { scientificName: 'Euphorbia dendroides', commonName: 'Euphorbe arborescente' },
    { scientificName: 'Eucalyptus torquata', commonName: 'Gommier corail' },
    { scientificName: 'Pinus canariensis', commonName: 'Pin des Canaries' },
    { scientificName: 'Ziziphus lotus', commonName: 'Jujubier sauvage' },
    { scientificName: 'Tetraclinis orientalis', commonName: 'Thuya de Barbarie' },
    { scientificName: 'Tetraclinis articulata', commonName: 'Thuya de Barbarie' },
    { scientificName: 'Taxus baccata', commonName: 'If commun' },
    { scientificName: 'Pinus roxburghii', commonName: 'Pin de Roxburgh' },
    { scientificName: 'Pinus radiata', commonName: 'Pin de Monterey' },
    { scientificName: 'Pinus pinea', commonName: 'Pin parasol' },
    { scientificName: 'Pinus pinaster maghrebiana', commonName: 'Pin maritime du Maghreb' },
    { scientificName: 'Pinus pinaster var. atlantica', commonName: 'Pin maritime de l\'Atlantique' },
    { scientificName: 'Pinus pinaster', commonName: 'Pin maritime' },
    { scientificName: 'Pinus nigra var. clusiana', commonName: 'Pin noir de Clusius' },
    { scientificName: 'Pinus nigra var. mauretanica', commonName: 'Pin noir de Maurétanie' },
    { scientificName: 'Pinus halepensis', commonName: 'Pin d\'Alep' },
    { scientificName: 'Juniperus thurifera', commonName: 'Genévrier thurifère' },
    { scientificName: 'Juniperus phoenicea', commonName: 'Genévrier de Phénicie' },
    { scientificName: 'Juniperus oxycedrus', commonName: 'Genévrier cade' },
    { scientificName: 'Cupressus glabra', commonName: 'Cyprès glabre' },
    { scientificName: 'Cupressus benthamii', commonName: 'Cyprès de Bentham' },
    { scientificName: 'Cupressus atlantica', commonName: 'Cyprès de l\'Atlas' },
    { scientificName: 'Cupressus arizonica', commonName: 'Cyprès de l\'Arizona' },
    { scientificName: 'Cupressus sempervirens', commonName: 'Cyprès de Provence' },
    { scientificName: 'Cupressus macrocarpa', commonName: 'Cyprès de Monterey' },
    { scientificName: 'Cupressus lusitanica', commonName: 'Cyprès du Portugal' },
    { scientificName: 'Celtis australis', commonName: 'Micocoulier de Provence' },
    { scientificName: 'Cedrus libani', commonName: 'Cèdre du Liban' },
    { scientificName: 'Cedrus atlantica', commonName: 'Cèdre de l\'Atlas' },
    { scientificName: 'Biota orientalis', commonName: 'Thuya d\'Orient' },
    { scientificName: 'Abies pinsapo', commonName: 'Sapin d\'Espagne' },
    { scientificName: 'Abies maroccana', commonName: 'Sapin du Maroc' },
    { scientificName: 'Schinus molle', commonName: 'Faux-poivrier' },
    { scientificName: 'Salix babylonica', commonName: 'Saule pleureur' },
    { scientificName: 'Robinia pseudoacacia', commonName: 'Robinier faux-acacia' },
    { scientificName: 'Quercus suber', commonName: 'Chêne-liège' },
    { scientificName: 'Quercus pyrenaica', commonName: 'Chêne des Pyrénées' },
    { scientificName: 'Quercus rotundifolia', commonName: 'Chêne vert' },
    { scientificName: 'Quercus fruticosa', commonName: 'Chêne buissonnant' },
    { scientificName: 'Quercus faginea', commonName: 'Chêne faginé' },
    { scientificName: 'Quercus coccifera', commonName: 'Chêne kermès' },
    { scientificName: 'Quercus borealis', commonName: 'Chêne rouge d\'Amérique' },
    { scientificName: 'Quercus aegilops', commonName: 'Chêne du Liban' },
    { scientificName: 'Prunus prostrata', commonName: 'Prunier prostré' },
    { scientificName: 'Populus nigra', commonName: 'Peuplier noir' },
    { scientificName: 'Populus euramericana', commonName: 'Peuplier hybride' },
    { scientificName: 'Populus euphratica', commonName: 'Peuplier de l\'Euphrate' },
    { scientificName: 'Populus alba', commonName: 'Peuplier blanc' },
    { scientificName: 'Pistacia terebinthus', commonName: 'Térébinthe' },
    { scientificName: 'Pistacia atlantica', commonName: 'Pistachier de l\'Atlas' },
    { scientificName: 'Olea europaea', commonName: 'Olivier' },
    { scientificName: 'Juglans regia', commonName: 'Noyer commun' },
    { scientificName: 'Fraxinus angustifolia', commonName: 'Frêne à feuilles étroites' },
    { scientificName: 'Eucalyptus tereticornis', commonName: 'Gommier des forêts' },
    { scientificName: 'Eucalyptus sideroxylon', commonName: 'Gommier à écorce de fer' },
    { scientificName: 'Eucalyptus robusta', commonName: 'Eucalyptus robuste' },
    { scientificName: 'Eucalyptus occidentalis', commonName: 'Gommier de l\'ouest' },
    { scientificName: 'Eucalyptus gomphocephala', commonName: 'Gommier tuart' },
    { scientificName: 'Eucalyptus globulus', commonName: 'Gommier bleu' },
    { scientificName: 'Eucalyptus camaldulensis', commonName: 'Gommier rouge' },
    { scientificName: 'Crataegus laciniata', commonName: 'Aubépine laciniée' },
    { scientificName: 'Ceratonia siliqua', commonName: 'Caroubier' },
    { scientificName: 'Casuarina stricta', commonName: 'Filao' },
    { scientificName: 'Casuarina glauca', commonName: 'Filao glauque' },
    { scientificName: 'Casuarina equisetifolia', commonName: 'Filao à feuilles de prêle' },
    { scientificName: 'Casuarina cunninghamiana', commonName: 'Filao de Cunningham' },
    { scientificName: 'Argania spinosa', commonName: 'Arganier' },
    { scientificName: 'Araucaria excelsa', commonName: 'Pin de Norfolk' },
    { scientificName: 'Acer opalus', commonName: 'Érable à feuilles d\'obier' },
    { scientificName: 'Acer monspessulanum', commonName: 'Érable de Montpellier' },
    { scientificName: 'Acacia raddiana', commonName: 'Acacia raddiana' },
    { scientificName: 'Acacia podalyriaefolia', commonName: 'Mimosa à feuilles de Podalyria' },
    { scientificName: 'Acacia mollissima', commonName: 'Mimosa noir' },
    { scientificName: 'Acacia melanoxylon', commonName: 'Mimosa à bois noir' },
    { scientificName: 'Acacia longifolia', commonName: 'Mimosa à longues feuilles' },
    { scientificName: 'Acacia gummifera', commonName: 'Gommier marocain' },
    { scientificName: 'Acacia farnesiana', commonName: 'Cassier' },
    { scientificName: 'Acacia dealbata', commonName: 'Mimosa d\'hiver' },
    { scientificName: 'Acacia cyclops', commonName: 'Acacia cyclops' },
    { scientificName: 'Acacia cyanophylla', commonName: 'Mimosa bleuâtre' },
    { scientificName: 'Acacia cultriformis', commonName: 'Mimosa couteau' },
    { scientificName: 'Acacia baileyana', commonName: 'Mimosa de Bailey' },
    { scientificName: 'Withania frutescens', commonName: 'Withania frutescens' },
    { scientificName: 'Viburnum tinus', commonName: 'Laurier-tin' },
    { scientificName: 'Ulmus campestris', commonName: 'Orme champêtre' },
    { scientificName: 'Ulex parviflorus', commonName: 'Ajonc de Provence' },
    { scientificName: 'Tipuana speciosa', commonName: 'Tipa' },
    { scientificName: 'Thymelaea tartonraira', commonName: 'Thymelaea tartonraira' },
    { scientificName: 'Thymelaea lythroides', commonName: 'Thymelaea lythroides' },
    { scientificName: 'Teline linifolia', commonName: 'Teline à feuilles de lin' },
    { scientificName: 'Sorbus torminalis', commonName: 'Alisier torminal' },
    { scientificName: 'Sorbus aria', commonName: 'Alisier blanc' },
    { scientificName: 'Smilax aspera', commonName: 'Salsepareille' },
    { scientificName: 'Salvia mellifera', commonName: 'Sauge noire' },
    { scientificName: 'Salvia ocheri', commonName: 'Sauge ocre' },
    { scientificName: 'Salvia apiana', commonName: 'Sauge blanche' },
    { scientificName: 'Rubus ulmifolius', commonName: 'Ronce à feuilles d\'orme' },
    { scientificName: 'Rosmarinus officinalis', commonName: 'Romarin officinal' },
    { scientificName: 'Rhus pentaphylla', commonName: 'Sumac à cinq feuilles' },
    { scientificName: 'Retama sphaerocarpa', commonName: 'Genêt à fruits sphériques' },
    { scientificName: 'Retama monosperma', commonName: 'Genêt blanc' },
    { scientificName: 'Pteridium aquilinum', commonName: 'Fougère aigle' },
    { scientificName: 'Pistacia lentiscus', commonName: 'Pistachier lentisque' },
    { scientificName: 'Phillyrea media', commonName: 'Filaire à feuilles moyennes' },
    { scientificName: 'Phillyrea angustifolia', commonName: 'Filaire à feuilles étroites' },
    { scientificName: 'Phillyrea angustifolia latifolia', commonName: 'Filaire à larges feuilles' },
    { scientificName: 'Myrtus communis', commonName: 'Myrte commun' },
    { scientificName: 'Morus alba', commonName: 'Mûrier blanc' },
    { scientificName: 'Mentha pulegium', commonName: 'Menthe pouliot' },
    { scientificName: 'Lavandula stoechas', commonName: 'Lavande stoechas' },
    { scientificName: 'Lavandula pedunculata var. atlantica', commonName: 'Lavande d\'atlantique' },
    { scientificName: 'Lavandula multifida', commonName: 'Lavande multifide' },
    { scientificName: 'Inula viscosa', commonName: 'Inule visqueuse' },
    { scientificName: 'Ilex aquifolium', commonName: 'Houx commun' },
    { scientificName: 'Globularia nainii', commonName: 'Globulaire de Nain' },
    { scientificName: 'Globularia alypum', commonName: 'Globulaire turbith' },
    { scientificName: 'Gleditsia triacanthos', commonName: 'Févier d\'Amérique' },
    { scientificName: 'Erica multiflora', commonName: 'Bruyère à nombreuses fleurs' },
    { scientificName: 'Erica arborea', commonName: 'Bruyère arborescente' },
    { scientificName: 'Cytisus arboreus', commonName: 'Cytise arborescent' },
    { scientificName: 'Colutea arborescens', commonName: 'Baguenaudier' },
    { scientificName: 'Cistus salviifolius', commonName: 'Ciste à feuilles de sauge' },
    { scientificName: 'Cistus populifolius', commonName: 'Ciste à feuilles de peuplier' },
    { scientificName: 'Cistus monspeliensis', commonName: 'Ciste de Montpellier' },
    { scientificName: 'Cistus libanotis', commonName: 'Ciste du Liban' },
    { scientificName: 'Cistus laurifolius', commonName: 'Ciste à feuilles de laurier' },
    { scientificName: 'Cistus ladanifer', commonName: 'Ciste ladanifère' },
    { scientificName: 'Cistus crispus', commonName: 'Ciste crépu' },
    { scientificName: 'Cistus albidus', commonName: 'Ciste cotonneux' },
    { scientificName: 'Chamaerops humilis', commonName: 'Palmier nain' },
    { scientificName: 'Chamaecyparis lawsoniana', commonName: 'Cyprès de Lawson' },
    { scientificName: 'Callistemon citrinum', commonName: 'Rince-bouteille' },
    { scientificName: 'Calycotome intermedia', commonName: 'Calycotome intermedia' },
    { scientificName: 'Calycotome villosa', commonName: 'Genêt velu' },
    { scientificName: 'Buxus balearica', commonName: 'Buis des Baléares' },
    { scientificName: 'Bupleurum spinosum', commonName: 'Buplèvre épineux' },
    { scientificName: 'Brachychiton populneus', commonName: 'Arbre bouteille' },
    { scientificName: 'Atriplex nummularia', commonName: 'Arroche nummulaire' },
    { scientificName: 'Astragalus armatus ssp. numidicus', commonName: 'Astragale de numidie' },
    { scientificName: 'Artemisia herba-alba', commonName: 'Armoise blanche' },
    { scientificName: 'Arbutus unedo', commonName: 'Arbousier' },
];

const processedSpecies: Species[] = speciesList.map((s, index) => {
    const species: Species = {
        ...s,
        id: `esp-${String(index + 1).padStart(3, '0')}`,
        genus: s.scientificName.split(' ')[0],
        group: 'Groupe par défaut'
    };

    if (s.scientificName.startsWith('Pinus')) species.group = 'Pinus';
    if (s.scientificName.startsWith('Cedrus')) species.group = 'Cedrus atlantica';
    if (s.scientificName.startsWith('Tetraclinis')) species.group = 'Tetraclinis articulata';
    
    // Add some coefficients for demonstration
    if (s.scientificName === 'Pinus halepensis') { // esp-034
        species.seedingCoefficientKgPer1000Plants = 0.5;
        species.group = 'Pinus halepensis';
    }
    if (s.scientificName === 'Cedrus atlantica') { // esp-047
        species.seedingCoefficientKgPer1000Plants = 1.2;
    }
    if (s.scientificName === 'Eucalyptus camaldulensis') { // esp-082
        species.seedingCoefficientKgPer1000Plants = 0.2;
    }
    if (s.scientificName === 'Quercus suber') { // esp-056
        species.seedingCoefficientKgPer1000Plants = 8.5; // Acorns are heavy
    }
     if (s.scientificName === 'Argania spinosa') { // esp-098
        species.seedingCoefficientKgPer1000Plants = 15.0; 
    }
     if (s.scientificName === 'Pinus canariensis') { // esp-021
        species.group = 'Pinus canariensis';
    }
    if (s.scientificName === 'Pinus pinaster moghrebiana') { // esp-029
        species.group = 'Pinus pinaster moghrebiana';
    }


    return species;
});

const regions: Region[] = [
    { id: 'reg-I1', code: 'I1', name: 'Rif Atlantique' },
    { id: 'reg-I2', code: 'I2', name: 'Rif Occidental' },
    { id: 'reg-I3', code: 'I3', name: 'Rif Oriental' },
    { id: 'reg-II1', code: 'II1', name: 'Plaine Moulouya' },
    { id: 'reg-II2', code: 'II2', name: 'Hauts Plateaux' },
    { id: 'reg-III1', code: 'III1', name: 'Maâmora' },
    { id: 'reg-III2', code: 'III2', name: 'Plateau Central' },
    { id: 'reg-IV1', code: 'IV1', name: 'Moyen Atlas Occidental' },
    { id: 'reg-IV2', code: 'IV2', name: 'Moyen Atlas Oriental' },
    { id: 'reg-IV3', code: 'IV3', name: 'Moyen Atlas Steppique' },
    { id: 'reg-IX', code: 'IX', name: 'Le Sahara' },
    { id: 'reg-V1', code: 'V1', name: 'Messeta Atlantique' },
    { id: 'reg-V2', code: 'V2', name: 'Messeta Continentale' },
    { id: 'reg-VI1', code: 'VI1', name: 'Haut Atlas Occidental' },
    { id: 'reg-VI2', code: 'VI2', name: 'Haut Atlas Central' },
    { id: 'reg-VI3', code: 'VI3', name: 'Haut Atlas Oriental' },
    { id: 'reg-VII1', code: 'VII1', name: 'Souss Nord' },
    { id: 'reg-VII2', code: 'VII2', name: 'Souss Sud' },
    { id: 'reg-VIII', code: 'VIII', name: 'Le Présahara' },
];

const provenances: Provenance[] = [
    { id: 'prov-01', code: 'IV2-TA-Barajmdaz', name: 'Baraj mdaz', localisation: 'Adrei', regionId: 'reg-IV2', speciesId: 'esp-024' },
    { id: 'prov-02', code: 'IV1-TA-Bouyaguer', name: 'Bouyaguer', localisation: 'Agouray', regionId: 'reg-IV1', speciesId: 'esp-024' },
    { id: 'prov-03', code: 'I3-ES-Aknoul', name: 'Aknoul', localisation: 'Aknoul', regionId: 'reg-I3', speciesId: 'esp-078' },
    { id: 'prov-04', code: 'IV1-CA-SidiMguild', name: 'Sidi M\'guild', localisation: 'Azrou', regionId: 'reg-IV1', speciesId: 'esp-047' },
];


const generateHardcodedData = (): MockData => ({
    srs: [
        { id: 'srs-01', name: 'Azrou', dranef: 'Fès-Meknès', province: 'Ifrane' },
        { id: 'srs-02', name: 'Sidi Amira', dranef: 'Marrakech Safi', province: 'Essaouira' },
        { id: 'srs-03', name: 'Chefchaouen', dranef: 'Tanger Tétouan Al Houceima', province: 'Chefchaouen' },
        { id: 'srs-04', name: 'Marrakech', dranef: 'Marrakech Safi', province: 'Marrakech' },
    ],
    species: processedSpecies,
    regions: regions,
    provenances: provenances,
    prestataires: [
        { id: 'prest-01', name: 'Forêt Pro', address: '12 Rue de la Forêt, Rabat', phone: '0537000001' },
        { id: 'prest-02', name: 'Semences Atlas', address: 'Avenue Atlas, Ifrane', phone: '0535000002' },
        { id: 'prest-03', name: 'Vert-Service', address: 'Quartier Industriel, Marrakech', phone: '0524000003' },
    ],
    lots: [
        { id: '23-PH-I3-001', quantityKg: 150, harvestYear: 2023, harvestDate: '2023-06-15', category: 'Récolte', speciesId: 'esp-034', provenanceId: 'prov-03', srsId: 'srs-01', prestataireId: 'prest-02', status: 'En stock', seedStand: 'Aknoul' },
        { id: '23-FA-IV2-001', quantityKg: 200, harvestYear: 2023, harvestDate: '2023-07-20', category: 'Récolte', speciesId: 'esp-076', provenanceId: 'prov-01', srsId: 'srs-02', prestataireId: 'prest-01', status: 'En stock', seedStand: 'Adrei' },
        { id: '24-AS-IV1-001', quantityKg: 80, harvestYear: 2024, harvestDate: '2024-02-10', category: 'Achat', speciesId: 'esp-098', provenanceId: 'prov-02', srsId: 'srs-04', status: 'En traitement', seedStand: 'Agouray' },
        { id: '24-PC-IV1-001', quantityKg: 120, harvestYear: 2024, harvestDate: '2024-03-05', category: 'Récolte', speciesId: 'esp-021', provenanceId: 'prov-04', srsId: 'srs-01', prestataireId: 'prest-02', status: 'En stock', seedStand: 'Azrou' },
        { id: '22-TA-IV2-001', quantityKg: 50, harvestYear: 2022, harvestDate: '2022-08-01', category: 'Achat', speciesId: 'esp-014', provenanceId: 'prov-01', srsId: 'srs-03', status: 'Distribué', seedStand: 'Adrei' },
    ],
    seedTreatments: [
        { id: 'TRT-001', lotId: '24-AS-IV1-001', treatmentType: 'Trempage', startDate: '2024-02-11', endDate: '2024-02-12', operator: 'Ahmed Ali', status: 'Terminé', observations: 'Trempage 24h dans l\'eau.' },
        { id: 'TRT-002', lotId: '24-PC-IV1-001', treatmentType: 'Stratification à froid', startDate: '2024-03-06', endDate: '2024-04-06', operator: 'Fatima Zohra', status: 'En cours' },
        { id: 'TRT-003', lotId: '23-PH-I3-001', treatmentType: 'Traitement fongicide', startDate: '2023-06-16', endDate: '2023-06-16', operator: 'Ahmed Ali', status: 'Terminé', observations: 'Application de Thiram.' },
    ],
    qualityChecks: [
        { id: 'QC-001', lotId: '23-PH-I3-001', checkType: 'Avant Conditionnement', date: '2023-06-20', germinationRate: 92, purity: 99, moistureContent: 8.5, thousandSeedWeight: 5.2, result: 'Pass' },
        { id: 'QC-002', lotId: '23-FA-IV2-001', checkType: 'Avant Conditionnement', date: '2023-07-25', germinationRate: 88, purity: 98, moistureContent: 9.1, thousandSeedWeight: 15.5, result: 'Pass' },
        { id: 'QC-003', lotId: '24-AS-IV1-001', checkType: 'Avant Conditionnement', date: '2024-02-15', germinationRate: 74, purity: 95, moistureContent: 10.2, thousandSeedWeight: 3.1, result: 'Fail' },
        { id: 'QC-004', lotId: '24-AS-IV1-001', checkType: 'Après Conditionnement', date: '2024-02-28', germinationRate: 85, purity: 97, moistureContent: 8.0, thousandSeedWeight: 3.1, result: 'Pass' },
        { id: 'QC-005', lotId: '24-PC-IV1-001', checkType: 'Périodique', date: '2024-05-10', germinationRate: 90, purity: 99, moistureContent: 8.6, thousandSeedWeight: 5.3, result: 'Pass' },
        { id: 'QC-006', lotId: '23-PH-I3-001', checkType: 'Périodique', date: '2024-01-15', germinationRate: 89, purity: 99, moistureContent: 8.7, thousandSeedWeight: 5.2, result: 'Pass' },
    ],
    stockItems: [
        { id: 'STK-001', lotId: '23-PH-I3-001', speciesId: 'esp-034', quantityKg: 150, entryDate: '2023-07-01', srsId: 'srs-01' },
        { id: 'STK-002', lotId: '23-FA-IV2-001', speciesId: 'esp-076', quantityKg: 200, entryDate: '2023-08-01', srsId: 'srs-02' },
        { id: 'STK-003', lotId: '24-PC-IV1-001', speciesId: 'esp-021', quantityKg: 120, entryDate: '2024-03-20', srsId: 'srs-01' },
    ],
    fructificationEvaluations: [
        { id: 'FE-001', programId: 'PE-2024-A', srsId: 'srs-01', reportSummary: 'Pin d\'Alep - Fructification Bonne', evaluationDate: '2024-04-15' },
        { id: 'FE-002', programId: 'PE-2024-B', srsId: 'srs-03', reportSummary: 'Acacia - Fructification Moyenne', evaluationDate: '2024-04-20' },
        { id: 'FE-003', programId: 'PE-2024-A', srsId: 'srs-04', reportSummary: 'Eucalyptus - Fructification Faible', evaluationDate: '2024-05-01' },
    ],
    seedNeeds: [
        { id: 'BS-001', dranef: 'FES MEKNES', province: 'Ifrane', project: 'Projet de reboisement Atlas', perimeterName: 'Périmètre Ifrane-A', speciesId: 'esp-047', numberOfPlants: 50000, calculatedSeedQuantityKg: 60, requestDate: '2024-02-10', status: 'Traité' },
        { id: 'BS-002', dranef: 'TANGER TETOAUEN EL HOUCELIMA', province: 'Chefchaouen', project: 'Projet Rif Vert', perimeterName: 'Périmètre Talassemtane', speciesId: 'esp-034', numberOfPlants: 120000, calculatedSeedQuantityKg: 60, requestDate: '2024-03-05', status: 'Validé' },
        { id: 'BS-003', dranef: 'MERRAKECH SAFI', province: 'Essaouira', project: 'Projet Arganier', perimeterName: 'Périmètre Sidi Kaouki', speciesId: 'esp-098', numberOfPlants: 75000, calculatedSeedQuantityKg: 1125, requestDate: '2024-04-12', status: 'Nouveau' },
        { id: 'BS-004', dranef: 'SOUS MASSA', province: 'Agadir', project: 'Projet Souss Conservation', perimeterName: 'Périmètre Aoulouz', speciesId: 'esp-082', numberOfPlants: 200000, calculatedSeedQuantityKg: 40, requestDate: '2024-05-20', status: 'Nouveau' },
    ],
    evaluationPrograms: [
        { id: 'PE-2024-A', speciesId: 'esp-034', srsId: 'srs-01', province: 'Ifrane', programmedDate: '2024-09-15', status: 'Planifié' },
        { id: 'PE-2024-B', speciesId: 'esp-098', srsId: 'srs-03', province: 'Chefchaouen', programmedDate: '2024-10-01', status: 'Planifié' },
        { id: 'PE-2023-C', speciesId: 'esp-076', srsId: 'srs-02', province: 'Essaouira', programmedDate: '2023-11-20', realDate: '2023-11-18', status: 'Terminé' },
    ],
    distributions: [
        { id: 'DIST-001', stockItemId: 'STK-001', quantityKg: 20, destination: 'CIRF-Rabat', distributionDate: '2024-01-15' },
        { id: 'DIST-002', stockItemId: 'STK-002', quantityKg: 50, destination: 'MFP-Béni Mellal', distributionDate: '2024-02-20' },
        { id: 'DIST-003', stockItemId: 'STK-001', quantityKg: 10, destination: 'Autre - Projet X', distributionDate: '2024-04-05' },
    ]
});

/**
 * Generates or retrieves cached mock data for the seed management application.
 * This function simulates a call to the Gemini API to get structured data.
 * To avoid repeated "API calls" during development, it caches the result.
 */
export const generateMockData = async (): Promise<MockData> => {
    if (cachedData) {
        return Promise.resolve(cachedData);
    }
    
    // In a real scenario, you would make an API call like this:
    /*
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Génère des données fictives pour un système de gestion de semences basé sur le diagramme fourni. Inclus des espèces, des provenances, des lots, des contrôles qualité et des articles en stock.",
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    // ... JSON schema definition here
                },
            },
        });
        const jsonData = JSON.parse(response.text);
        cachedData = jsonData as MockData;
        return cachedData;
    } catch (error) {
        console.error("Error calling Gemini API, falling back to hardcoded data.", error);
        cachedData = generateHardcodedData();
        return cachedData;
    }
    */
    
    // For this example, we use a timeout to simulate network latency
    // and then return hardcoded data.
    return new Promise(resolve => {
        setTimeout(() => {
            cachedData = generateHardcodedData();
            resolve(cachedData);
        }, 500); // Simulate 0.5 second delay
    });
};

/**
 * Simulates a call to the Gemini API to get dashboard insights.
 * @param dataSummary A summary of the current data.
 * @returns A string containing AI-generated insights.
 */
export const getAIInsights = async (dataSummary: object): Promise<string> => {
    // In a real scenario, you would make an API call like this:
    /*
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `
        En tant qu'expert en gestion de semences pour le reboisement au Maroc, analysez les données suivantes : ${JSON.stringify(dataSummary)}.
        Fournissez 2 à 3 aperçus exploitables sous forme de liste à puces.
        Concentrez-vous sur les alertes de stock, les besoins urgents, et les opportunités d'optimisation.
        Le ton doit être professionnel et concis. Chaque aperçu doit commencer par un titre en gras (ex: **Alerte stock bas**).
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    return response.text;
    */

    // Mock implementation for demonstration
    return new Promise(resolve => {
        setTimeout(() => {
            const insights = [
                "**Alerte stock bas** : La demande pour le Cèdre de l'Atlas (esp-047) est élevée mais les stocks sont critiques. Il est urgent de planifier une récolte ou un achat.",
                "**Opportunité d'optimisation** : Vous disposez d'un surplus de semences de Pin d'Alep (esp-034). Proposez cette espèce en priorité pour les projets de reboisement à venir.",
                "**Contrôle Qualité Requis** : Le lot 23-FA-IV2-001 (Frêne à feuilles étroites) n'a pas subi de contrôle qualité récent. Un test de germination est recommandé pour garantir sa viabilité."
            ];
            resolve(insights.join('\n\n'));
        }, 1500); // Simulate 1.5 second delay for AI generation
    });
};