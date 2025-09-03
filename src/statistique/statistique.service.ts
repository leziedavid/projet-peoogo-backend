
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { BaseResponse } from 'src/dto/request/base-response.dto';
import * as ExcelJS from "exceljs";
import { Response } from "express";
import { EnrollementsFilterDto } from "src/dto/request/exportEnrollementsFilter.dto";
import { UsersFilterDto } from "src/dto/request/exportUsersFilter.dto";

@Injectable()
export class StatistiqueService {
    constructor(private readonly prisma: PrismaService) { }
    async getDashboardStats() {
        // Comptages simples
        const totalOrders = await this.prisma.ecommerceOrder.count();
        const totalProducts = await this.prisma.product.count();
        const totalTransactions = await this.prisma.transaction.count();
        const totalEnrollements = await this.prisma.enrollements.count();
        const totalUsers = await this.prisma.user.count();
        const totalNotifications = await this.prisma.notification.count();

        // Graphiques : nombre par jour sur les 30 derniers jours
        const ordersGraph = await this.prisma.ecommerceOrder.groupBy({
            by: ["createdAt"],
            _count: { _all: true },
            orderBy: { createdAt: "asc" },
            where: {
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
        });

        const productsGraph = await this.prisma.product.groupBy({
            by: ["createdAt"],
            _count: { _all: true },
            orderBy: { createdAt: "asc" },
            where: {
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
        });

        const transactionsGraph = await this.prisma.transaction.groupBy({
            by: ["createdAt"],
            _count: { _all: true },
            orderBy: { createdAt: "asc" },
            where: {
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
        });

        const enrollementsGraph = await this.prisma.enrollements.groupBy({
            by: ["createdAt"],
            _count: { _all: true },
            orderBy: { createdAt: "asc" },
            where: {
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
        });

        const usersGraph = await this.prisma.user.groupBy({
            by: ["createdAt"],
            _count: { _all: true },
            orderBy: { createdAt: "asc" },
            where: {
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
        });

        const notificationsGraph = await this.prisma.notification.groupBy({
            by: ["createdAt"],
            _count: { _all: true },
            orderBy: { createdAt: "asc" },
            where: {
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
        });

        // Formatage des données graphiques
        const formatGraph = (data: any[]) =>
            data.map((item) => ({
                date: item.createdAt.toISOString().split("T")[0],
                total: item._count._all,
            }));

        return new BaseResponse(200, "Statistiques du tableau de bord", {
            totals: {
                orders: totalOrders,
                products: totalProducts,
                transactions: totalTransactions,
                enrollements: totalEnrollements,
                users: totalUsers,
                notifications: totalNotifications,
            },
            graphs: {
                orders: formatGraph(ordersGraph),
                products: formatGraph(productsGraph),
                transactions: formatGraph(transactionsGraph),
                enrollements: formatGraph(enrollementsGraph),
                users: formatGraph(usersGraph),
                notifications: formatGraph(notificationsGraph),
            },
        });
    }

    /**
     * Export complet des Users avec toutes leurs informations et leurs Enrollements
     */


    /**
     * Export Users filtré par createdAt
     */
    async exportUsersExcel(res: Response, filter: UsersFilterDto) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Users");

        const where: any = {};
        if (filter.startDate || filter.endDate) {
            where.createdAt = {};
            if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
            if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
            if (filter.role) where.role = filter.role;
        }

        const users = await this.prisma.user.findMany({ where });

        const enrollements = await this.prisma.enrollements.findMany({
            include: {
                decoupage: { include: { district: true, region: true, department: true, sousPrefecture: true, localite: true } },
                activitprincipale: true,
                spculationprincipale: true,
                autresActivites: { include: { activite: true } },
                autresSpeculations: { include: { speculation: true } },
            },
        });

        const enrollementMap = new Map(enrollements.map(e => [e.id, e]));

        sheet.columns = [
            { header: "UserID", key: "userId", width: 36 },
            { header: "Name", key: "name", width: 20 },
            { header: "Email", key: "email", width: 25 },
            { header: "Code", key: "code", width: 15 },
            { header: "Role", key: "role", width: 15 },
            { header: "Status", key: "status", width: 15 },
            { header: "TypeCompte", key: "typeCompte", width: 20 },
            { header: "PhoneCountryCode", key: "phoneCountryCode", width: 15 },
            { header: "PhoneNumber", key: "phoneNumber", width: 15 },
            { header: "CreatedAt", key: "createdAt", width: 20 },
            { header: "UpdatedAt", key: "updatedAt", width: 20 },

            // Enrollements
            { header: "EnrollementID", key: "enrollementId", width: 36 },
            { header: "EnrollementCode", key: "enrollementCode", width: 20 },
            { header: "EnrollementNom", key: "enrollementNom", width: 20 },
            { header: "EnrollementPrenom", key: "enrollementPrenom", width: 20 },
            { header: "EnrollementTypeCompte", key: "enrollementTypeCompte", width: 20 },
            { header: "EnrollementDateNaissance", key: "enrollementDateNaissance", width: 20 },
            { header: "EnrollementLieuNaissance", key: "enrollementLieuNaissance", width: 25 },
            { header: "EnrollementSexe", key: "enrollementSexe", width: 10 },
            { header: "Decoupage", key: "decoupage", width: 50 },
            { header: "ActivitePrincipale", key: "activitePrincipale", width: 25 },
            { header: "SpeculationPrincipale", key: "speculationPrincipale", width: 25 },
            { header: "AutresActivites", key: "autresActivites", width: 40 },
            { header: "AutresSpeculations", key: "autresSpeculations", width: 40 },
        ];

        users.forEach(u => {
            const e = u.enrollementsId ? enrollementMap.get(u.enrollementsId) : null;
            sheet.addRow({
                userId: u.id,
                name: u.name,
                email: u.email,
                code: u.codeGenerate,
                role: u.role,
                status: u.status,
                typeCompte: u.typeCompte,
                phoneCountryCode: u.phoneCountryCode ?? "",
                phoneNumber: u.phoneNumber ?? "",
                createdAt: u.createdAt.toISOString(),
                updatedAt: u.updatedAt.toISOString(),

                enrollementId: e?.id ?? "",
                enrollementCode: e?.code ?? "",
                enrollementNom: e?.nom ?? "",
                enrollementPrenom: e?.prenom ?? "",
                enrollementTypeCompte: e?.TypeCompte ?? "",
                enrollementDateNaissance: e?.datedenaissance?.toISOString() ?? "",
                enrollementLieuNaissance: e?.lieudenaissance ?? "",
                enrollementSexe: e?.sexe ?? "",
                decoupage: e ? `${e.decoupage?.district?.nom ?? ""} / ${e.decoupage?.region?.nom ?? ""} / ${e.decoupage?.department?.nom ?? ""} / ${e.decoupage?.sousPrefecture?.nom ?? ""} / ${e.decoupage?.localite?.nom ?? ""}` : "",
                activitePrincipale: e?.activitprincipale?.nom ?? "",
                speculationPrincipale: e?.spculationprincipale?.nom ?? "",
                autresActivites: e?.autresActivites.map(a => a.activite.nom).join(", ") ?? "",
                autresSpeculations: e?.autresSpeculations.map(s => s.speculation.nom).join(", ") ?? "",
            });
        });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=users.xlsx");
        await workbook.xlsx.write(res);
        res.end();
    }
    /**
     * Export Enrollements filtré par status_dossier et période start_date / end_date
     */
    async exportEnrollementsExcel(res: Response, filter: EnrollementsFilterDto) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Enrollements");

        const where: any = {};
        if (filter.statusDossier) where.status_dossier = filter.statusDossier;
        if (filter.startDate || filter.endDate) {
            where.start_date = {};
            if (filter.startDate) where.start_date.gte = new Date(filter.startDate);
            if (filter.endDate) where.start_date.lte = new Date(filter.endDate);
        }

        const enrollements = await this.prisma.enrollements.findMany({
            where,
            include: {
                decoupage: { include: { district: true, region: true, department: true, sousPrefecture: true, localite: true } },
                activitprincipale: true,
                spculationprincipale: true,
                autresActivites: { include: { activite: true } },
                autresSpeculations: { include: { speculation: true } },
                agent_enroleur: true,
                agent_superviseur: true,
                user_control: true,
            },
        });

        // Colonnes identiques à ton code actuel
        sheet.columns = [
            { header: "EnrollementID", key: "id", width: 36 },
            { header: "Code", key: "code", width: 20 },
            { header: "TypeCompte", key: "TypeCompte", width: 20 },
            { header: "Nom", key: "nom", width: 20 },
            { header: "Prénom", key: "prenom", width: 20 },
            { header: "DateNaissance", key: "datedenaissance", width: 20 },
            { header: "LieuNaissance", key: "lieudenaissance", width: 25 },
            { header: "Sexe", key: "sexe", width: 10 },
            { header: "Site", key: "site", width: 20 },
            { header: "Nationalité", key: "nationalit", width: 20 },
            { header: "SituationMatrimoniale", key: "situationmatrimoniale", width: 20 },
            { header: "NiveauInstruction", key: "niveaudinstruction", width: 20 },
            { header: "NumPrincipal", key: "numroprincipal", width: 20 },
            { header: "Découpage", key: "decoupage", width: 50 },
            { header: "ActivitéPrincipale", key: "activitePrincipale", width: 25 },
            { header: "SpéculationPrincipale", key: "speculationPrincipale", width: 25 },
            { header: "AutresActivites", key: "autresActivites", width: 40 },
            { header: "AutresSpeculations", key: "autresSpeculations", width: 40 },
            { header: "AgentEnroleur", key: "agentEnroleur", width: 25 },
            { header: "AgentSuperviseur", key: "agentSuperviseur", width: 25 },
            { header: "UserControl", key: "userControl", width: 25 },
            { header: "ConfirmValidationControl", key: "confirmValidationControl", width: 15 },
            { header: "DateValidationControl", key: "dateValidationControl", width: 20 },
            { header: "DateConfirmValidationControl", key: "dateConfirmValidationControl", width: 20 },
            { header: "CommentaireControle", key: "commentaireControle", width: 40 },
            { header: "StatusDossier", key: "statusDossier", width: 20 },
            { header: "TimeEnrolment", key: "timeEnrolment", width: 15 },
            { header: "StartDate", key: "startDate", width: 20 },
            { header: "EndDate", key: "endDate", width: 20 },
            { header: "CreatedAt", key: "createdAt", width: 20 },
            { header: "UpdatedAt", key: "updatedAt", width: 20 },
        ];

        enrollements.forEach(e => {
            sheet.addRow({
                id: e.id,
                code: e.code,
                TypeCompte: e.TypeCompte,
                nom: e.nom,
                prenom: e.prenom,
                datedenaissance: e.datedenaissance.toISOString(),
                lieudenaissance: e.lieudenaissance,
                sexe: e.sexe,
                site: e.site ?? "",
                nationalit: e.nationalit ?? "",
                situationmatrimoniale: e.situationmatrimoniale,
                niveaudinstruction: e.niveaudinstruction,
                numroprincipal: e.numroprincipal ?? "",
                decoupage: `${e.decoupage?.district?.nom ?? ""} / ${e.decoupage?.region?.nom ?? ""} / ${e.decoupage?.department?.nom ?? ""} / ${e.decoupage?.sousPrefecture?.nom ?? ""} / ${e.decoupage?.localite?.nom ?? ""}`,
                activitePrincipale: e.activitprincipale?.nom ?? "",
                speculationPrincipale: e.spculationprincipale?.nom ?? "",
                autresActivites: e.autresActivites.map(a => a.activite.nom).join(", "),
                autresSpeculations: e.autresSpeculations.map(s => s.speculation.nom).join(", "),
                agentEnroleur: e.agent_enroleur?.name ?? "",
                agentSuperviseur: e.agent_superviseur?.name ?? "",
                userControl: e.user_control?.name ?? "",
                confirmValidationControl: e.confirm_validation_control ?? false,
                dateValidationControl: e.date_validation_control?.toISOString() ?? "",
                dateConfirmValidationControl: e.date_confirm_validation_control?.toISOString() ?? "",
                commentaireControle: e.commentaire_controle ?? "",
                statusDossier: e.status_dossier ?? "",
                timeEnrolment: e.time_enrolment ?? "",
                startDate: e.start_date?.toISOString() ?? "",
                endDate: e.end_date?.toISOString() ?? "",
                createdAt: e.createdAt.toISOString(),
                updatedAt: e.updatedAt.toISOString(),
            });
        });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=enrollements.xlsx");
        await workbook.xlsx.write(res);
        res.end();


    }


}







interface ExportUsersFilter {
    startDate?: string; // ISO string
    endDate?: string;   // ISO string
    typeCompte?: string;
}

interface ExportEnrollementsFilter {
    statusDossier?: string;
    startDate?: string; // ISO string
    endDate?: string;   // ISO string
}