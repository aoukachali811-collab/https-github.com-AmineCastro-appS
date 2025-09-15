
import React from 'react';
import Card from './shared/Card';

const SrsManagement: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Gestion des SRS</h1>
            <Card>
                <div className="text-center text-slate-500 py-10">
                    <p className="text-lg">La gestion des SRS (Stations de Recherche en Semences) sera bientôt disponible.</p>
                    <p>Cette section permettra d'ajouter, de modifier et de supprimer des stations.</p>
                </div>
            </Card>
        </div>
    );
};

export default SrsManagement;
