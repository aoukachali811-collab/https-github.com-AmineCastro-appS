import React, { useState, useEffect, useMemo } from 'react';
import type { MockData, SeedNeed, Species } from '../types';
import { generateMockData } from '../services/geminiService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';
import Table from './shared/Table';
import type { Column } from './shared/Table';
import Modal from './shared/Modal';

const DRANEFS = [
    "ORIENTAL",
    "TANGER TETOAUEN EL HOUCELIMA",
    "MERRAKECH SAFI",
    "RABAT SALE KENITRA",
    "FES MEKNES",
    "SOUS MASSA",
    "GUELMIM OUED NOUN",
    "LAAYOUNE SAKIA LHAMRA",
    "DAKHELA OUED DAHAB",
    "BENI MELAL KHENIFRA",
];

const dranefProvinces: Record<string, string[]> = {
    "ORIENTAL": ["Oujda", "Taourirt", "Figuig", "Jerada", "Driouch", "Nador", "Berkane", "Guercif"],
    "TANGER TETOAUEN EL HOUCELIMA": ["Tanger-Assilah", "Tétouan", "Al Hoceima", "Chefchaouen", "Larache", "M'diq-Fnideq", "Ouezzane", "Fahs-Anjra"],
    "MERRAKECH SAFI": ["Marrakech", "Safi", "Essaouira", "Chichaoua", "Al Haouz", "Kelaat Sraghna", "Rehamna", "Youssoufia"],
    "RABAT SALE KENITRA": ["Rabat", "Salé", "Kénitra", "Skhirat-Témara", "Khemisset", "Sidi Kacem", "Sidi Slimane"],
    "FES MEKNES": ["Fès", "Meknès", "Ifrane", "El Hajeb", "Sefrou", "Moulay Yacoub", "Boulemane", "Taza", "Taounate"],
    "SOUS MASSA": ["Agadir-Ida Ou Tanane", "Inezgane-Aït Melloul", "Chtouka-Aït Baha", "Taroudant", "Tiznit", "Tata"],
    "GUELMIM OUED NOUN": ["Guelmim", "Assa-Zag", "Sidi Ifni", "Tan-Tan"],
    "LAAYOUNE SAKIA LHAMRA": ["Laâyoune", "Boujdour", "Tarfaya", "Es-Semara"],
    "DAKHELA OUED DAHAB": ["Oued Ed-Dahab", "Aousserd"],
    "BENI MELAL KHENIFRA": ["Beni Mellal", "Khénifra", "Khouribga", "Azilal", "Fquih Ben Salah"],
};

const SeedNeeds: React.FC = () => {
    const [data, setData] = useState<MockData | null>(null);
    const [needs, setNeeds] = useState<SeedNeed[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<SeedNeed> | null>(null);
    const [selectedGenus, setSelectedGenus] = useState<string>('');
    const [calculatedQty, setCalculatedQty] = useState<number>(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const mockData = await generateMockData();
                setData(mockData);
                setNeeds(mockData.seedNeeds);
                setError(null);
            } catch (err) {
                setError('Failed to load seed needs data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const { speciesMap, genera, speciesByGenus } = useMemo(() => {
        if (!data) return { speciesMap: new Map(), genera: [], speciesByGenus: new Map() };
        const speciesMap = new Map(data.species.map(s => [s.id, s]));
        const genera = [...new Set(data.species.map(s => s.genus))].sort();
        const speciesByGenus = new Map<string, Species[]>();
        data.species.forEach(s => {
            const list = speciesByGenus.get(s.genus) || [];
            list.push(s);
            speciesByGenus.set(s.genus, list);
        });
        return { speciesMap, genera, speciesByGenus };
    }, [data]);
    
    useEffect(() => {
        if (currentItem?.speciesId && currentItem?.numberOfPlants && data) {
            const species = speciesMap.get(currentItem.speciesId);
            const coefficient = species?.seedingCoefficientKgPer1000Plants || 0;
            const qty = (Number(currentItem.numberOfPlants) / 1000) * coefficient;
            setCalculatedQty(qty);
        } else {
            setCalculatedQty(0);
        }
    }, [currentItem?.speciesId, currentItem?.numberOfPlants, data, speciesMap]);


    const filteredNeeds = useMemo(() => {
        return needs.filter(need => {
            const species = speciesMap.get(need.speciesId);
            const searchTermLower = searchTerm.toLowerCase();

            const matchesSearch = (
                need.id.toLowerCase().includes(searchTermLower) ||
                (species && species.commonName.toLowerCase().includes(searchTermLower)) ||
                need.dranef.toLowerCase().includes(searchTermLower) ||
                need.province.toLowerCase().includes(searchTermLower) ||
                need.project.toLowerCase().includes(searchTermLower) ||
                need.status.toLowerCase().includes(searchTermLower)
            );

            const request = new Date(need.requestDate);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23, 59, 59, 999);

            const matchesDate = (!start || request >= start) && (!end || request <= end);

            return matchesSearch && matchesDate;
        });
    }, [needs, searchTerm, startDate, endDate, speciesMap]);

    const handleOpenModal = (need: SeedNeed | null = null) => {
        if(need) {
            const species = speciesMap.get(need.speciesId);
            setSelectedGenus(species?.genus || '');
            setCurrentItem({ ...need });
        } else {
            setSelectedGenus('');
            setCurrentItem({ status: 'Nouveau' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
        setSelectedGenus('');
        setCalculatedQty(0);
    };

    const handleSave = () => {
        if (!currentItem || !currentItem.speciesId || !currentItem.numberOfPlants) {
            alert("Veuillez remplir tous les champs requis.");
            return;
        };

        const species = speciesMap.get(currentItem.speciesId);
        const coefficient = species?.seedingCoefficientKgPer1000Plants || 0;
        const calculatedSeedQuantityKg = (Number(currentItem.numberOfPlants) / 1000) * coefficient;

        if (currentItem.id) {
            // Edit
            const updatedItem = { ...currentItem, calculatedSeedQuantityKg } as SeedNeed;
            setNeeds(needs.map(n => n.id === currentItem.id ? updatedItem : n));
        } else {
            // Add
            const newNeed: SeedNeed = {
                ...currentItem,
                id: `BS-${Date.now()}`,
                requestDate: currentItem.requestDate || new Date().toISOString().split('T')[0],
                calculatedSeedQuantityKg,
            } as SeedNeed;
            setNeeds([newNeed, ...needs]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce besoin ?')) {
            setNeeds(needs.filter(n => n.id !== id));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentItem(prev => {
            if (!prev) return null;
            const updated = { ...prev, [name]: value };
            // If DRANEF changes, reset province
            if (name === 'dranef') {
                updated.province = '';
            }
            return updated;
        });
    };

    const handleGenusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedGenus(e.target.value);
        setCurrentItem(prev => prev ? { ...prev, speciesId: '' } : null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /><p className="ml-4 text-slate-600">Loading Seed Needs...</p></div>;
    }
    if (error) {
        return <div className="text-center text-red-500 font-semibold">{error}</div>;
    }
    if (!data) {
        return <div className="text-center text-slate-500">No seed need data available.</div>;
    }

    const columns: Column<SeedNeed>[] = [
        { Header: 'ID Besoin', accessor: 'id' },
        { Header: 'DRANEF', accessor: 'dranef' },
        { Header: 'Espèce', accessor: (row) => speciesMap.get(row.speciesId)?.commonName || 'N/A' },
        { Header: 'Nbre Plants', accessor: 'numberOfPlants' },
        { Header: 'Semences (kg) (Est.)', accessor: (row) => row.calculatedSeedQuantityKg.toFixed(2) },
        { Header: 'Date Demande', accessor: 'requestDate' },
        { 
            Header: 'Statut', 
            accessor: 'status',
            Cell: ({ value }) => {
                const statusColor = {
                    'Nouveau': 'bg-yellow-100 text-yellow-800',
                    'Validé': 'bg-blue-100 text-blue-800',
                    'Traité': 'bg-green-100 text-green-800',
                }[value] || 'bg-slate-100 text-slate-800';
                return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>{value}</span>;
            }
        },
        {
            Header: 'Actions',
            accessor: 'id',
            Cell: ({ row }) => (
                <div className="flex space-x-2">
                    <button onClick={() => handleOpenModal(row)} className="text-blue-600 hover:text-blue-900" title="Modifier">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-900" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            )
        }
    ];

    const provincesForSelectedDranef = currentItem?.dranef ? dranefProvinces[currentItem.dranef] || [] : [];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Besoins en Semences (PSI)</h1>
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="search" className="sr-only">Rechercher</label>
                        <input
                            id="search"
                            type="text"
                            placeholder="Rechercher par ID, espèce, DRANEF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                             <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">De</label>
                             <input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">À</label>
                            <input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                        Ajouter un Besoin
                    </button>
                </div>
                <Table columns={columns} data={filteredNeeds} />
            </Card>

             {isModalOpen && currentItem && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem.id ? 'Modifier le Besoin' : 'Nouveau Besoin'}>
                     <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="dranef" className="block text-sm font-medium text-slate-700">DRANEF</label>
                                <select name="dranef" value={currentItem.dranef || ''} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                    <option value="">Sélectionner une DRANEF</option>
                                    {DRANEFS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="province" className="block text-sm font-medium text-slate-700">Province (DPANEF)</label>
                                <select 
                                    name="province" 
                                    value={currentItem.province || ''} 
                                    onChange={handleInputChange}
                                    disabled={!currentItem.dranef}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md disabled:bg-slate-50"
                                >
                                    <option value="">Sélectionner une province</option>
                                    {provincesForSelectedDranef.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="project" className="block text-sm font-medium text-slate-700">Projet</label>
                                <input type="text" name="project" value={currentItem.project || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label htmlFor="perimeterName" className="block text-sm font-medium text-slate-700">Nom périmètre</label>
                                <input type="text" name="perimeterName" value={currentItem.perimeterName || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Genre</label>
                                <select value={selectedGenus} onChange={handleGenusChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                    <option value="">Sélectionner un genre</option>
                                    {genera.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="speciesId" className="block text-sm font-medium text-slate-700">Espèce</label>
                                <select name="speciesId" value={currentItem.speciesId || ''} onChange={handleInputChange} disabled={!selectedGenus} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md disabled:bg-slate-50">
                                    <option value="">Sélectionner une espèce</option>
                                    {selectedGenus && speciesByGenus.get(selectedGenus)?.map(s => <option key={s.id} value={s.id}>{s.commonName}</option>)}
                                </select>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="numberOfPlants" className="block text-sm font-medium text-slate-700">Nombre de Plants</label>
                                <input type="number" name="numberOfPlants" value={currentItem.numberOfPlants || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Semences Requises (kg)</label>
                                <div className="mt-1 p-2 bg-slate-100 rounded-md text-slate-700 font-semibold">{calculatedQty.toFixed(2)} kg</div>
                            </div>
                         </div>
                        <div>
                            <label htmlFor="requestDate" className="block text-sm font-medium text-slate-700">Date de Demande</label>
                            <input type="date" name="requestDate" value={currentItem.requestDate || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                         <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-700">Statut</label>
                            <select name="status" value={currentItem.status} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                               <option>Nouveau</option>
                               <option>Validé</option>
                               <option>Traité</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button onClick={handleCloseModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Annuler</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Sauvegarder</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default SeedNeeds;