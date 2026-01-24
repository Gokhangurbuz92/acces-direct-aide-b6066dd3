
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast";

export default function AdminCategoryEdit() {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        label: '',
        slug: ''
    });

    const { data: category, isLoading } = useQuery({
        queryKey: ['category', id],
        queryFn: async () => {
            const res = await fetch(`/api/categories?id=${id}`, {
                headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('access_token') }
            });
            return res.json();
        },
        enabled: !!id
    });

    useEffect(() => {
        if (category) setFormData(category);
    }, [category]);

    const mutation = useMutation({
        mutationFn: async (data) => {
            const method = id ? 'PUT' : 'POST';
            const url = id ? `/api/categories?id=${id}` : '/api/categories';
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + sessionStorage.getItem('access_token')
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Error');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            navigate(createPageUrl('AdminCategories'));
            toast({ title: "Enregistré" });
        }
    });

    if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-xl mx-auto">
                <Link to={createPageUrl('AdminCategories')} className="flex items-center text-slate-600 mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                </Link>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">{id ? 'Modifier' : 'Créer'}</h1>
                    <Button onClick={() => mutation.mutate(formData)} disabled={mutation.isPending}>
                        <Save className="mr-2 h-4 w-4" /> Enregistrer
                    </Button>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div>
                            <Label>Nom</Label>
                            <Input
                                value={formData.label}
                                onChange={e => setFormData({...formData, label: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Slug</Label>
                            <Input
                                value={formData.slug}
                                onChange={e => setFormData({...formData, slug: e.target.value})}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
