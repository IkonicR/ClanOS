'use client';

import React, { useState } from 'react';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

interface ExportButtonProps {
    type: 'overview' | 'members' | 'wars' | 'capital' | 'insights';
    disabled?: boolean;
}

export function ExportButton({ type, disabled = false }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    const exportData = async (format: 'json' | 'csv') => {
        setIsExporting(true);
        
        try {
            const response = await fetch(`/api/analytics/export?type=${type}&format=${format}`);
            
            if (!response.ok) {
                throw new Error('Failed to export data');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Get filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = contentDisposition?.split('filename="')[1]?.split('"')[0] || 
                            `analytics_${type}_${new Date().toISOString().split('T')[0]}.${format}`;
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast({
                title: "Export Successful",
                description: `${type.charAt(0).toUpperCase() + type.slice(1)} data exported as ${format.toUpperCase()}`,
            });
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: "Export Failed",
                description: error instanceof Error ? error.message : "Failed to export data",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={disabled || isExporting}
                    className="flex items-center space-x-2"
                >
                    <Download className={`h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
                    <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    onClick={() => exportData('json')}
                    className="flex items-center space-x-2"
                >
                    <FileJson className="h-4 w-4 text-blue-500" />
                    <span>JSON</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={() => exportData('csv')}
                    className="flex items-center space-x-2"
                >
                    <FileSpreadsheet className="h-4 w-4 text-green-500" />
                    <span>CSV</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 