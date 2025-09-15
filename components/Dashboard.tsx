
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar, Text } from 'recharts';
import type { MockData } from '../types';
import { getAIInsights } from '../services/geminiService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';
import Modal from './shared/Modal';

declare const html2canvas: any;
declare const jspdf: any;

interface DashboardProps {
    data: MockData;
    setData: (data: MockData) => void;
}

const AIInsightsCard: React.FC<{
    onGenerate: () => void;
    insights: string | null;
    isLoading: boolean;
    error: string | null;
}> = ({ onGenerate, insights, isLoading, error }) => {

    const parseInsights = (text: string) => {
        return text.split('\n\n').map((line, index) => {
            const parts = line.split('** : ');
            if (parts.length === 2) {
                const title = parts[0].replace(/\*\*/g, '');
                const content = parts[1];
                return (
                    <li key={index} className="mb-3 pl-2 border-l-4 border-emerald-200">
                        <strong className="font-semibold text-slate-800">{title}</strong>: <span className="text-slate-600">{content}</span>
                    </li>
                );
            }
            return <li key={index} className="mb-2">{line}</li>;
        });
    };

    return (
        <Card className="md:col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-slate-700 mb-4">Aperçus de l'IA</h2>
                <LightbulbIcon/>
            </div>
             <div className="min-h-[150px] flex flex-col justify-center">
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <Spinner />
                        <p className="ml-3 text-slate-500">Analyse en cours...</p>
                    </div>
                ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                ) : insights ? (
                    <ul className="space-y-2 text-sm">
                        {parseInsights(insights)}
                    </ul>
                ) : (
                    <div className="text-center">
                        <p className="text-slate-500 mb-4">Obtenez des recommandations basées sur vos données.</p>
                        <button 
                            onClick={onGenerate}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                            Générer
                        </button>
                    </div>
                )}
            </div>
        </Card>
    );
};

const NeedsStatusCard: React.FC<{
    coverage: number;
    deficits: { speciesName: string; deficit: number }[];
    surpluses: { speciesName: string; surplus: number }[];
}> = ({ coverage, deficits, surpluses }) => {
    
    const getCoverageColor = (value: number) => {
        if (value < 30) return '#ef4444'; // red-500
        if (value < 70) return '#f59e0b'; // amber-500
        return '#10b981'; // emerald-500
    };

    const coverageColor = getCoverageColor(coverage);

    const radialData = [
        { name: 'coverage', value: coverage, fill: coverageColor }
    ];

    return (
        <Card className="md:col-span-2 lg:col-span-3">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">Statut des Besoins</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="w-full h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                            innerRadius="70%" 
                            outerRadius="90%" 
                            data={radialData} 
                            startAngle={90} 
                            endAngle={-270}
                            barSize={20}
                        >
                            <RadialBar 
                                background={{ fill: '#e2e8f0' }}
                                dataKey="value"
                                cornerRadius={10}
                            />
                             <text
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-3xl font-bold"
                                style={{ fill: coverageColor }}
                            >
                                {`${coverage.toFixed(0)}%`}
                            </text>
                            <text
                                x="50%"
                                y="65%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-sm text-slate-500"
                            >
                                Couverts
                            </text>
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center">
                        <AlertTriangleIcon className="text-amber-500 mr-2"/> Espèces en Déficit
                    </h3>
                    <ul className="text-sm space-y-1 max-h-36 overflow-y-auto pr-2">
                        {deficits.length > 0 ? deficits.map(d => (
                            <li key={d.speciesName} className="flex justify-between items-center bg-amber-50 p-1.5 rounded">
                                <span className="text-slate-600">{d.speciesName}</span>
                                <span className="font-bold text-amber-600">-{d.deficit.toFixed(1)} kg</span>
                            </li>
                        )) : <p className="text-slate-500 text-center py-4">Aucun déficit.</p>}
                    </ul>
                </div>
                 <div>
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center">
                        <CheckCircleIcon className="text-green-500 mr-2"/> Espèces en Surplus
                    </h3>
                    <ul className="text-sm space-y-1 max-h-36 overflow-y-auto pr-2">
                       {surpluses.length > 0 ? surpluses.map(s => (
                            <li key={s.speciesName} className="flex justify-between items-center bg-green-50 p-1.5 rounded">
                                <span className="text-slate-600">{s.speciesName}</span>
                                <span className="font-bold text-green-600">+{s.surplus.toFixed(1)} kg</span>
                            </li>
                        )) : <p className="text-slate-500 text-center py-4">Aucun surplus notable.</p>}
                    </ul>
                </div>
            </div>
        </Card>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ data, setData }) => {
    const [aiInsights, setAiInsights] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [aiError, setAiError] = useState<string | null>(null);
    
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    type GroupBy = 'species' | 'dranef' | 'detailed';
    const [analysisGroupBy, setAnalysisGroupBy] = useState<GroupBy>('species');

    const { 
        totalStockKg, totalLots, pendingQc, speciesCount,
        needsVsStockData, overallCoverage, speciesInDeficit, speciesInSurplus
    } = useMemo(() => {
        if (!data) return { 
            totalStockKg: 0, totalLots: 0, pendingQc: 0, speciesCount: 0,
            needsVsStockData: [], overallCoverage: 0, speciesInDeficit: [], speciesInSurplus: []
        };
        
        const { stockItems, species, qualityChecks, lots, seedNeeds } = data;
        const speciesMap = new Map(species.map(s => [s.id, s]));

        // Basic stats
        const _totalStockKg = stockItems.reduce((acc, item) => acc + item.quantityKg, 0);
        const _totalLots = lots.length;
        const _pendingQc = qualityChecks.filter(qc => qc.result === 'Fail').length;
        const _speciesCount = species.length;

        // Needs vs Stock calculation
        const needsBySpecies: Record<string, number> = seedNeeds.reduce((acc, need) => {
            acc[need.speciesId] = (acc[need.speciesId] || 0) + need.calculatedSeedQuantityKg;
            return acc;
        }, {} as Record<string, number>);

        const stockBySpecies: Record<string, number> = stockItems.reduce((acc, item) => {
            acc[item.speciesId] = (acc[item.speciesId] || 0) + item.quantityKg;
            return acc;
        }, {} as Record<string, number>);
        
        const allSpeciesIds = [...new Set([...Object.keys(needsBySpecies), ...Object.keys(stockBySpecies)])];
        
        let totalNeeded = 0;
        let totalStockCoveringNeeds = 0;
        const _speciesInDeficit: { speciesName: string; deficit: number }[] = [];
        const _speciesInSurplus: { speciesName: string; surplus: number }[] = [];

        const _needsVsStockData = allSpeciesIds.map(speciesId => {
            const needed = needsBySpecies[speciesId] || 0;
            const stocked = stockBySpecies[speciesId] || 0;
            const speciesName = speciesMap.get(speciesId)?.commonName || 'Inconnu';
            const balance = stocked - needed;

            totalNeeded += needed;
            totalStockCoveringNeeds += Math.min(stocked, needed);

            if (balance < 0) {
                _speciesInDeficit.push({ speciesName, deficit: -balance });
            } else if (balance > 0 && needed > 0) { 
                 _speciesInSurplus.push({ speciesName, surplus: balance });
            }
            
            return {
                name: speciesName,
                "Nécessaire (kg)": needed,
                "En Stock (kg)": stocked,
            };
        })
        .filter(d => d["Nécessaire (kg)"] > 0)
        .sort((a, b) => b["Nécessaire (kg)"] - a["Nécessaire (kg)"])
        .slice(0, 10); 

        const _overallCoverage = totalNeeded > 0 ? (totalStockCoveringNeeds / totalNeeded) * 100 : 100;

        return { 
            totalStockKg: _totalStockKg, 
            totalLots: _totalLots, 
            pendingQc: _pendingQc, 
            speciesCount: _speciesCount,
            needsVsStockData: _needsVsStockData,
            overallCoverage: _overallCoverage,
            speciesInDeficit: _speciesInDeficit.sort((a,b) => b.deficit - a.deficit),
            speciesInSurplus: _speciesInSurplus.sort((a,b) => b.surplus - a.surplus)
        };

    }, [data]);

    // FIX: Define a union type for analysis table rows to handle 'detailed' view having an extra 'species' property.
    type AnalysisRow = {
        key: string;
        needs: number;
        stock: number;
        balance: number;
        coverage: number;
        species?: string;
    };

    const analysisTableData: AnalysisRow[] = useMemo(() => {
        if (!data) return [];
        const { seedNeeds, stockItems, species, srs } = data;
        const speciesMap = new Map(species.map(s => [s.id, s.commonName]));
        const srsMap = new Map(srs.map(s => [s.id, { dranef: s.dranef, province: s.province }]));

        const combined: Record<string, { needs: number; stock: number; speciesName: string; dranef: string; province: string; speciesId: string }> = {};

        seedNeeds.forEach(need => {
            const key = `${need.dranef}|${need.province}|${need.speciesId}`;
            if (!combined[key]) {
                combined[key] = {
                    needs: 0,
                    stock: 0,
                    speciesName: speciesMap.get(need.speciesId) || 'Inconnu',
                    dranef: need.dranef,
                    province: need.province,
                    speciesId: need.speciesId
                };
            }
            combined[key].needs += need.calculatedSeedQuantityKg;
        });

        stockItems.forEach(item => {
            const srsInfo = srsMap.get(item.srsId);
            if (srsInfo) {
                const key = `${srsInfo.dranef}|${srsInfo.province}|${item.speciesId}`;
                 if (!combined[key]) {
                    combined[key] = {
                        needs: 0,
                        stock: 0,
                        speciesName: speciesMap.get(item.speciesId) || 'Inconnu',
                        dranef: srsInfo.dranef,
                        province: srsInfo.province,
                        speciesId: item.speciesId
                    };
                }
                combined[key].stock += item.quantityKg;
            }
        });

        const flatData = Object.values(combined).filter(d => d.needs > 0 || d.stock > 0);

        let groupedData: Record<string, { needs: number; stock: number }> = {};
        if (analysisGroupBy === 'species') {
            groupedData = flatData.reduce((acc, item) => {
                if (!acc[item.speciesName]) acc[item.speciesName] = { needs: 0, stock: 0 };
                acc[item.speciesName].needs += item.needs;
                acc[item.speciesName].stock += item.stock;
                return acc;
            }, {} as Record<string, { needs: number; stock: number }>);
        } else if (analysisGroupBy === 'dranef') {
            groupedData = flatData.reduce((acc, item) => {
                if (!acc[item.dranef]) acc[item.dranef] = { needs: 0, stock: 0 };
                acc[item.dranef].needs += item.needs;
                acc[item.dranef].stock += item.stock;
                return acc;
            }, {} as Record<string, { needs: number; stock: number }>);
        } else { // 'detailed'
             return flatData.map(item => ({
                key: `${item.province} (${item.dranef.substring(0,4)})`,
                species: item.speciesName,
                needs: item.needs,
                stock: item.stock,
                balance: item.stock - item.needs,
                coverage: item.needs > 0 ? (item.stock / item.needs) * 100 : (item.stock > 0 ? Infinity : 100)
            })).sort((a,b) => a.key.localeCompare(b.key));
        }
        
        return Object.entries(groupedData).map(([key, { needs, stock }]) => ({
            key,
            needs,
            stock,
            balance: stock - needs,
            coverage: needs > 0 ? (stock / needs) * 100 : (stock > 0 ? Infinity : 100)
        })).sort((a,b) => b.needs - a.needs);

    }, [data, analysisGroupBy]);


    const handleGenerateInsights = async () => {
        if (!data) return;
        setIsGenerating(true);
        setAiError(null);
        try {
            const summary = {
                totalStockKg,
                totalLots,
                pendingQc,
                speciesCount,
                deficits: speciesInDeficit.slice(0, 3), 
            };
            const insights = await getAIInsights(summary);
            setAiInsights(insights);
        } catch (err) {
            setAiError("Impossible de générer les aperçus. Veuillez réessayer.");
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const exportToPdf = async () => {
        const printableArea = document.querySelector<HTMLElement>('.print-area');
        if (!printableArea) {
            console.error("Printable area not found!");
            return;
        }

        setIsGeneratingPdf(true);

        const titleElement = printableArea.querySelector<HTMLElement>('.print-title');
        const buttonBar = printableArea.querySelector<HTMLElement>('.no-print');

        if (titleElement) titleElement.style.display = 'block';
        if (buttonBar) buttonBar.style.display = 'none';

        try {
            const canvas = await html2canvas(printableArea, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({
                orientation: 'landscape',
                unit: 'pt',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`analyse_besoins_stock_${analysisGroupBy}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Une erreur est survenue lors de la génération du PDF.");
        } finally {
            if (titleElement) titleElement.style.display = '';
            if (buttonBar) buttonBar.style.display = '';
            setIsGeneratingPdf(false);
        }
    };

    const exportToCsv = () => {
        let headers = [];
        if (analysisGroupBy === 'detailed') {
            headers = ['Province (DRANEF)', 'Espèce', 'Besoins (kg)', 'Stock (kg)', 'Bilan (kg)', 'Taux de Couverture (%)'];
        } else {
            headers = [analysisGroupBy === 'species' ? 'Espèce' : 'DRANEF', 'Besoins (kg)', 'Stock (kg)', 'Bilan (kg)', 'Taux de Couverture (%)'];
        }

        const dataToExport = analysisTableData.map(row => {
            const coverage = isFinite(row.coverage) ? `${row.coverage.toFixed(0)}%` : 'N/A';
             if (analysisGroupBy === 'detailed') {
                // FIX: Use non-null assertion for `row.species` as it's guaranteed to exist in 'detailed' view.
                return [row.key, row.species!, row.needs.toFixed(2), row.stock.toFixed(2), row.balance.toFixed(2), coverage];
            }
            return [row.key, row.needs.toFixed(2), row.stock.toFixed(2), row.balance.toFixed(2), coverage];
        });

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(';'), ...dataToExport.map(e => e.join(';'))].join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `analyse_besoins_stock_${analysisGroupBy}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const StatCard: React.FC<{ icon: JSX.Element; title: string; value: string | number; color: string }> = ({ icon, title, value, color }) => (
        <Card>
            <div className="flex items-center">
                <div className={`p-3 rounded-full mr-4 ${color}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-slate-500">{title}</p>
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                </div>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Tableau de bord</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard 
                    icon={<InventoryIcon />} 
                    title="Stock Total (kg)" 
                    value={totalStockKg.toFixed(2)}
                    color="bg-blue-100 text-blue-600"
                />
                <StatCard 
                    icon={<LotIcon />} 
                    title="Lots Actifs" 
                    value={totalLots}
                    color="bg-green-100 text-green-600"
                />
                <StatCard 
                    icon={<QualityIcon />} 
                    title="Contrôles Non Conformes" 
                    value={pendingQc}
                    color="bg-yellow-100 text-yellow-600"
                />
                <StatCard 
                    icon={<SpeciesIcon />} 
                    title="Espèces Gérées" 
                    value={speciesCount}
                    color="bg-purple-100 text-purple-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <NeedsStatusCard 
                    coverage={overallCoverage}
                    deficits={speciesInDeficit}
                    surpluses={speciesInSurplus}
                />
                 <AIInsightsCard 
                    onGenerate={handleGenerateInsights}
                    insights={aiInsights}
                    isLoading={isGenerating}
                    error={aiError}
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-xl font-semibold text-slate-700 mb-4">Besoins vs. Stock par Espèce (Top 10)</h2>
                    <div className="w-full h-[450px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                layout="vertical" 
                                data={needsVsStockData} 
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" tick={{ fill: '#475569' }} />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    width={150} 
                                    tick={{ fill: '#475569', fontSize: 12 }} 
                                    interval={0}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                    }}
                                    cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                                />
                                <Legend />
                                <Bar dataKey="Nécessaire (kg)" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
                                <Bar dataKey="En Stock (kg)" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card>
                     <div className="flex items-start justify-between">
                        <h2 className="text-xl font-semibold text-slate-700 mb-4">Analyse & Exportation</h2>
                        <ChartBarIcon />
                    </div>
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                        <p className="text-slate-500 mb-4 text-center">Analysez en profondeur la couverture des besoins et exportez vos données.</p>
                        <button 
                            onClick={() => setIsAnalysisModalOpen(true)}
                            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center"
                        >
                           <SearchIcon className="mr-2" /> Lancer l'Analyse Détaillée
                        </button>
                    </div>
                </Card>
            </div>
            {isAnalysisModalOpen && (
                <Modal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} title="Analyse Détaillée: Besoins vs. Stock">
                    <div className="print-area">
                        <h2 className="print-title">Analyse Détaillée: Besoins vs. Stock</h2>
                        <div className="bg-slate-100 p-3 rounded-lg flex items-center justify-between no-print">
                           <div className="flex items-center space-x-4">
                                <span className="font-semibold text-slate-600">Grouper par:</span>
                                <div className="flex space-x-2">
                                    {(['species', 'dranef', 'detailed'] as GroupBy[]).map(group => (
                                         <button 
                                            key={group}
                                            onClick={() => setAnalysisGroupBy(group)}
                                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${analysisGroupBy === group ? 'bg-emerald-600 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-200'}`}
                                         >
                                             {group === 'species' ? 'Espèce' : group === 'dranef' ? 'DRANEF' : 'Détaillée'}
                                         </button>
                                    ))}
                                </div>
                           </div>
                           <div className="flex items-center space-x-2">
                                <button onClick={exportToCsv} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"><FileExcelIcon className="mr-1.5"/>Exporter CSV</button>
                                <button 
                                    onClick={exportToPdf} 
                                    disabled={isGeneratingPdf}
                                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center disabled:bg-red-400 disabled:cursor-not-allowed"
                                >
                                    <FilePdfIcon className="mr-1.5"/>
                                    {isGeneratingPdf ? 'Génération...' : 'Exporter PDF'}
                                </button>
                           </div>
                        </div>

                        <div className="mt-4 max-h-[55vh] overflow-y-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        {analysisGroupBy === 'detailed' ? (
                                            <>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Province (DRANEF)</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Espèce</th>
                                            </>
                                        ) : (
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{analysisGroupBy === 'species' ? 'Espèce' : 'DRANEF'}</th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Besoins (kg)</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Stock (kg)</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Bilan (kg)</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Couverture</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {analysisTableData.map((row, index) => {
                                        const balanceColor = row.balance < 0 ? 'text-red-600' : 'text-green-600';
                                        const coverageColor = row.coverage < 50 ? 'bg-red-100 text-red-800' : row.coverage < 100 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
                                        const coverageText = isFinite(row.coverage) ? `${row.coverage.toFixed(0)}%` : 'N/A';
                                        
                                        return (
                                            <tr key={index} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">{row.key}</td>
                                                {analysisGroupBy === 'detailed' && <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{row.species}</td>}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{row.needs.toFixed(2)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{row.stock.toFixed(2)}</td>
                                                <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${balanceColor}`}>{row.balance.toFixed(2)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${coverageColor}`}>{coverageText}</span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                     {analysisTableData.length === 0 && (
                                        <tr>
                                            <td colSpan={analysisGroupBy === 'detailed' ? 6 : 5} className="text-center py-8 text-slate-500">Aucune donnée à analyser.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// --- ICONS ---
const LightbulbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);
const CheckCircleIcon = ({ className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);
const InventoryIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s-4 2-4 4s4 4 4 4m16-8s4 2 4 4s-4 4-4 4"></path></svg>
);
const LotIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
);
const QualityIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const SpeciesIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 7.172a4 4 0 00-5.656 0M9.172 16.828a4 4 0 005.656 0M9 12a2 2 0 104 0 2 2 0 00-4 0z"></path></svg>
);
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
const SearchIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
const FileExcelIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a2 2 0 00-2 2v12a2 2 0 002 2h2a2 2 0 002-2V4a2 2 0 00-2-2h-2z" /><path d="M4 6a2 2 0 012-2h2v12H6a2 2 0 01-2-2V6z" /><path d="M14 4h2a2 2 0 012 2v10a2 2 0 01-2 2h-2V4z" /></svg>
const FilePdfIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v12H4V4z" clipRule="evenodd" /><path d="M6 10a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2a.5.5 0 01-.5-.5zM6 12a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5zM6 14a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5z" /><path d="M12.5 6a.5.5 0 00-1 0v1.5a.5.5 0 00.5.5H13a.5.5 0 000-1h-.5V6z" /><path d="M10.5 6a.5.5 0 00-1 0v4a.5.5 0 001 0V6z" /></svg>
const AlertTriangleIcon = ({ className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.22 3.008-1.742 3.008H4.42c-1.522 0-2.492-1.674-1.742-3.008l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

export default Dashboard;
