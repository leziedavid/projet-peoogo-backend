// Déclarer en dehors de la classe
export interface EnrichedProducer {
    id: string;
    name: string;
    phoneNumber?: string | null;
    typeCompte?: string | null;
    totalQuantity: number;
    totalAmount: number;
}
