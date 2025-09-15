import React, { useState, useEffect, useMemo } from 'react';
import type { MockData, Distribution, StockItem, Species } from '../types';
import { generateMockData } from '../services/geminiService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';
import Table from './shared/Table';
import type { Column } from './shared/Table';
import Modal from './shared/Modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const DistributionPage: React.FC = () => {
    const [data, setData] = useState<MockData | null>(null);
    const [distributions, setDistributions] = useState<Distribution[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<Distribution> | null>(null);

    const [summaryBy, setSummaryBy] = useState<'species' | 'destination'>('species');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const mockData = await generateMockData();
                setData(mockData);
                setDistributions(mockData.distributions);
                setError(null);
            } catch (err) {
                setError('Failed to load distribution data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    
    const { stockItemMap, speciesMap } = useMemo(() => {
        if (!data) return { stockItemMap: new Map(), speciesMap: new Map() };
        const stockItemMap = new Map(data.stockItems.map(s => [s.id, s]));
        const speciesMap = new Map(data.species.map(s => [s.id, s]));
        return { stockItemMap, speciesMap };
    }, [data]);

    const filteredDistributions = useMemo(() => {
        return distributions.filter(dist => {
            const stockItem = stockItemMap.get(dist.stockItemId);
            const species = stockItem ? speciesMap.get(stockItem.speciesId) : null;
            const searchTermLower = searchTerm.toLowerCase();

            const matchesSearch = (
                dist.id.toLowerCase().includes(searchTermLower) ||
                (stockItem && stockItem.lotId.toLowerCase().includes(searchTermLower)) ||
                (species && species.commonName.toLowerCase().includes(searchTermLower)) ||
                dist.destination.toLowerCase().includes(searchTermLower)
            );

            const distDate = new Date(dist.distributionDate);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23, 59, 59, 999);

            const matchesDate = (!start || distDate >= start) && (!end || distDate <= end);

            return matchesSearch && matchesDate;
        });
    }, [distributions, searchTerm, startDate, endDate, stockItemMap, speciesMap]);

    const summaryData = useMemo(() => {
        if (!data) return [];
        
        const groupedData: { [key: string]: number } = {};

        filteredDistributions.forEach(dist => {
            let key = '';
            if (summaryBy === 'species') {
                const stockItem = stockItemMap.get(dist.stockItemId);
                const species = stockItem ? speciesMap.get(stockItem.speciesId) : null;
                key = species ? species.commonName : 'Inconnue';
            } else { // destination
                key = dist.destination;
            }

            if (key) {
                groupedData[key] = (groupedData[key] || 0) + dist.quantityKg;
            }
        });

        return Object.entries(groupedData)
            .map(([name, quantity]) => ({ name, quantity: parseFloat(quantity.toFixed(2)) }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 7); // Top 7

    }, [filteredDistributions, summaryBy, stockItemMap, speciesMap, data]);


    const handleOpenModal = (item: Distribution | null = null) => {
        setCurrentItem(item ? { ...item } : {});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
    };

    const handleSave = () => {
        if (!currentItem) return;

        if (currentItem.id) {
            // Edit
            setDistributions(distributions.map(d => d.id === currentItem.id ? currentItem as Distribution : d));
        } else {
            // Add
            const newItem: Distribution = {
                ...currentItem,
                id: `DIST-${Date.now()}`,
                distributionDate: currentItem.distributionDate || new Date().toISOString().split('T')[0],
            } as Distribution;
            setDistributions([newItem, ...distributions]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette distribution ?')) {
            setDistributions(distributions.filter(d => d.id !== id));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentItem(prev => prev ? { ...prev, [name]: value } : null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /><p className="ml-4 text-slate-600">Loading Distribution Data...</p></div>;
    }
    if (error) {
        return <div className="text-center text-red-500 font-semibold">{error}</div>;
    }
    if (!data) {
        return <div className="text-center text-slate-500">No distribution data available.</div>;
    }

    const columns: Column<Distribution>[] = [
        { Header: 'ID Distribution', accessor: 'id' },
        { 
            Header: 'ID Lot (Stock)', 
            accessor: (row) => stockItemMap.get(row.stockItemId)?.lotId || 'N/A' 
        },
        { 
            Header: 'Espèce', 
            accessor: (row) => {
                const stockItem = stockItemMap.get(row.stockItemId);
                return stockItem ? (speciesMap.get(stockItem.speciesId)?.commonName || 'N/A') : 'N/A';
            }
        },
        { Header: 'Quantité (kg)', accessor: 'quantityKg' },
        { Header: 'Date de Distribution', accessor: 'distributionDate' },
        { Header: 'Destination', accessor: 'destination' },
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

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Distribution des Semences</h1>
            
            <Card>
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-semibold text-slate-700">Statistiques de Distribution</h2>
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => setSummaryBy('species')}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${summaryBy === 'species' ? 'bg-emerald-600 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-200'}`}
                        >
                            Par Espèce
                        </button>
                        <button 
                            onClick={() => setSummaryBy('destination')}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${summaryBy === 'destination' ? 'bg-emerald-600 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-200'}`}
                        >
                            Par Destination
                        </button>
                    </div>
                </div>
                <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={summaryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tick={{ fill: '#475569' }} />
                            <YAxis dataKey="name" type="category" width={150} tick={{ fill: '#475569', fontSize: 12 }} interval={0} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem',
                                }}
                                cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                            />
                            <Legend />
                            <Bar dataKey="quantity" name="Quantité (kg)" fill="#34d399" radius={[0, 4, 4, 0]} barSize={20}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
                     <div className="md:col-span-2">
                        <label htmlFor="search" className="sr-only">Rechercher</label>
                        <input
                            id="search"
                            type="text"
                            placeholder="Rechercher par Lot, Espèce, Destination..."
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
                        Nouvelle Distribution
                    </button>
                </div>
                <Table columns={columns} data={filteredDistributions} />
            </Card>

            {isModalOpen && currentItem && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem.id ? 'Modifier la Distribution' : 'Nouvelle Distribution'}>
                     <div className="space-y-4">
                        <div>
                            <label htmlFor="stockItemId" className="block text-sm font-medium text-slate-700">Article en Stock (Lot - Espèce)</label>
                            <select name="stockItemId" value={currentItem.stockItemId || ''} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option value="">Sélectionner un article</option>
                                {data.stockItems.map(item => <option key={item.id} value={item.id}>{item.lotId} - {speciesMap.get(item.speciesId)?.commonName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="quantityKg" className="block text-sm font-medium text-slate-700">Quantité Distribuée (kg)</label>
                            <input type="number" name="quantityKg" value={currentItem.quantityKg || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="destination" className="block text-sm font-medium text-slate-700">Destination</label>
                            <input type="text" name="destination" value={currentItem.destination || ''} placeholder="Ex: CIRF, Titulaire MFP, Autre" onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="distributionDate" className="block text-sm font-medium text-slate-700">Date de Distribution</label>
                            <input type="date" name="distributionDate" value={currentItem.distributionDate || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
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

export default DistributionPage;