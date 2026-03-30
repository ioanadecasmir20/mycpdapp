import { WebPlugin } from '@capacitor/core';
import type { AppTransaction, NativePurchasesPlugin, Product, PURCHASE_TYPE, Transaction } from './definitions';
export declare class NativePurchasesWeb extends WebPlugin implements NativePurchasesPlugin {
    restorePurchases(): Promise<void>;
    getProducts(options: {
        productIdentifiers: string[];
    }): Promise<{
        products: Product[];
    }>;
    getProduct(options: {
        productIdentifier: string;
    }): Promise<{
        product: Product;
    }>;
    purchaseProduct(options: {
        productIdentifier: string;
        planIdentifier: string;
        quantity: number;
    }): Promise<Transaction>;
    isBillingSupported(): Promise<{
        isBillingSupported: boolean;
    }>;
    getPluginVersion(): Promise<{
        version: string;
    }>;
    getPurchases(options?: {
        productType?: PURCHASE_TYPE;
    }): Promise<{
        purchases: Transaction[];
    }>;
    manageSubscriptions(): Promise<void>;
    acknowledgePurchase(_options: {
        purchaseToken: string;
    }): Promise<void>;
    consumePurchase(_options: {
        purchaseToken: string;
    }): Promise<void>;
    getAppTransaction(): Promise<{
        appTransaction: AppTransaction;
    }>;
    isEntitledToOldBusinessModel(_options: {
        targetVersion?: string;
        targetBuildNumber?: string;
    }): Promise<{
        isOlderVersion: boolean;
        originalAppVersion: string;
    }>;
}
