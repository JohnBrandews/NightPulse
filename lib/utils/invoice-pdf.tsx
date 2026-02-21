import React, { type ReactElement } from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    renderToBuffer,
    type DocumentProps,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        paddingTop: 0,
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 40,
        color: '#333333',
    },
    header: {
        backgroundColor: '#6366f1',
        padding: 30,
        paddingBottom: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    clubName: {
        fontSize: 22,
        color: '#ffffff',
        fontFamily: 'Helvetica-Bold',
        marginBottom: 6,
    },
    headerSubText: {
        fontSize: 9,
        color: '#e0e0ff',
        marginBottom: 2,
    },
    docTitle: {
        fontSize: 22,
        color: '#ffffff',
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4,
    },
    invoiceNum: {
        fontSize: 11,
        color: '#e0e0ff',
        marginBottom: 4,
    },
    headerDate: {
        fontSize: 9,
        color: '#e0e0ff',
        marginBottom: 2,
    },
    statusBadge: {
        marginTop: 8,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 10,
        alignSelf: 'flex-end',
    },
    statusText: {
        color: '#ffffff',
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
    },
    body: {
        paddingHorizontal: 30,
        paddingTop: 25,
    },
    twoCol: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    col: {
        flex: 1,
    },
    colRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    sectionLabel: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#6366f1',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoText: {
        fontSize: 10,
        color: '#444444',
        marginBottom: 3,
    },
    infoTextRight: {
        fontSize: 10,
        color: '#444444',
        marginBottom: 3,
        textAlign: 'right',
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        marginVertical: 15,
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f3f4ff',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 4,
    },
    tableHeaderCell: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#6366f1',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    tableRowAlt: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: '#fafafa',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    cellDescription: {
        flex: 3,
        fontSize: 10,
        color: '#333333',
    },
    cellAmount: {
        flex: 1,
        fontSize: 10,
        color: '#333333',
        textAlign: 'right',
    },
    totalsSection: {
        marginTop: 15,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 4,
    },
    totalLabel: {
        fontSize: 10,
        color: '#666666',
        width: 130,
        textAlign: 'right',
        marginRight: 10,
    },
    totalValue: {
        fontSize: 10,
        color: '#333333',
        width: 90,
        textAlign: 'right',
    },
    totalLabelBold: {
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        color: '#6366f1',
        width: 130,
        textAlign: 'right',
        marginRight: 10,
    },
    totalValueBold: {
        fontSize: 13,
        fontFamily: 'Helvetica-Bold',
        color: '#6366f1',
        width: 90,
        textAlign: 'right',
    },
    notesBox: {
        marginTop: 20,
        backgroundColor: '#fffbeb',
        padding: 12,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
    },
    notesLabel: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#92400e',
        marginBottom: 4,
    },
    notesText: {
        fontSize: 10,
        color: '#78350f',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#6366f1',
        paddingVertical: 14,
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    footerText: {
        color: '#ffffff',
        fontSize: 10,
        marginBottom: 2,
        textAlign: 'center',
    },
    footerSub: {
        color: '#c7d2fe',
        fontSize: 8,
        textAlign: 'center',
    },
});

interface InvoiceData {
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date;
    status: string;
    clientName: string;
    clientEmail?: string | null;
    clientPhone?: string | null;
    subtotal: number;
    tax: number;
    totalAmount: number;
    notes?: string | null;
    club: {
        name: string;
        address?: string | null;
        phone?: string | null;
        email?: string | null;
    };
    booking: {
        bookingType: string;
        date: Date;
        time: string;
        numberOfGuests: number;
        event?: { title: string } | null;
    };
}

function InvoicePDF({ invoice, isReceipt }: { invoice: InvoiceData; isReceipt: boolean }) {
    const statusColor =
        invoice.status === 'paid' ? '#22c55e'
            : invoice.status === 'overdraft' ? '#ef4444'
                : '#f59e0b';

    const fmt = (n: number) =>
        `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const fmtDate = (d: Date) =>
        new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });

    const fmtDateLong = (d: Date) =>
        new Date(d).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* ── Header ── */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.clubName}>{invoice.club.name}</Text>
                        {invoice.club.address ? (
                            <Text style={styles.headerSubText}>{invoice.club.address}</Text>
                        ) : null}
                        {invoice.club.phone ? (
                            <Text style={styles.headerSubText}>Tel: {invoice.club.phone}</Text>
                        ) : null}
                        {invoice.club.email ? (
                            <Text style={styles.headerSubText}>{invoice.club.email}</Text>
                        ) : null}
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.docTitle}>{isReceipt ? 'RECEIPT' : 'INVOICE'}</Text>
                        <Text style={styles.invoiceNum}>#{invoice.invoiceNumber}</Text>
                        <Text style={styles.headerDate}>
                            Date: {fmtDate(invoice.issueDate)}
                        </Text>
                        {!isReceipt && (
                            <Text style={styles.headerDate}>Due: {fmtDate(invoice.dueDate)}</Text>
                        )}
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                            <Text style={styles.statusText}>{invoice.status.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Body ── */}
                <View style={styles.body}>
                    {/* Bill To / Booking Details */}
                    <View style={styles.twoCol}>
                        <View style={styles.col}>
                            <Text style={styles.sectionLabel}>
                                {isReceipt ? 'Payment From' : 'Bill To'}
                            </Text>
                            <Text style={styles.infoText}>{invoice.clientName}</Text>
                            {invoice.clientEmail ? (
                                <Text style={styles.infoText}>{invoice.clientEmail}</Text>
                            ) : null}
                            {invoice.clientPhone ? (
                                <Text style={styles.infoText}>Tel: {invoice.clientPhone}</Text>
                            ) : null}
                        </View>
                        <View style={styles.colRight}>
                            <Text style={styles.sectionLabel}>Booking Details</Text>
                            <Text style={styles.infoTextRight}>
                                {invoice.booking.bookingType.toUpperCase()} Reservation
                            </Text>
                            <Text style={styles.infoTextRight}>
                                {fmtDateLong(invoice.booking.date)}
                            </Text>
                            <Text style={styles.infoTextRight}>Time: {invoice.booking.time}</Text>
                            <Text style={styles.infoTextRight}>
                                Guests: {invoice.booking.numberOfGuests}
                            </Text>
                            {invoice.booking.event ? (
                                <Text style={styles.infoTextRight}>
                                    Event: {invoice.booking.event.title}
                                </Text>
                            ) : null}
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Items Table */}
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Description</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>
                                Amount
                            </Text>
                        </View>

                        <View style={styles.tableRow}>
                            <Text style={styles.cellDescription}>
                                {invoice.booking.bookingType.toUpperCase()} Reservation
                                {invoice.booking.event ? ` — ${invoice.booking.event.title}` : ''}
                            </Text>
                            <Text style={styles.cellAmount}>{fmt(invoice.subtotal)}</Text>
                        </View>

                        <View style={styles.tableRowAlt}>
                            <Text style={styles.cellDescription}>VAT (1.5%)</Text>
                            <Text style={styles.cellAmount}>{fmt(invoice.tax)}</Text>
                        </View>
                    </View>

                    {/* Totals */}
                    <View style={styles.totalsSection}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal:</Text>
                            <Text style={styles.totalValue}>{fmt(invoice.subtotal)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>VAT (1.5%):</Text>
                            <Text style={styles.totalValue}>{fmt(invoice.tax)}</Text>
                        </View>
                        <View style={[styles.totalRow, { marginTop: 6 }]}>
                            <Text style={styles.totalLabelBold}>
                                {isReceipt ? 'TOTAL PAID:' : 'TOTAL DUE:'}
                            </Text>
                            <Text style={styles.totalValueBold}>{fmt(invoice.totalAmount)}</Text>
                        </View>
                    </View>

                    {/* Notes */}
                    {invoice.notes ? (
                        <View style={styles.notesBox}>
                            <Text style={styles.notesLabel}>Notes</Text>
                            <Text style={styles.notesText}>{invoice.notes}</Text>
                        </View>
                    ) : null}
                </View>

                {/* ── Footer ── */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {isReceipt ? 'Thank you for your payment!' : 'Thank you for your business!'}
                    </Text>
                    <Text style={styles.footerSub}>
                        Questions? Contact:{' '}
                        {invoice.club.email || invoice.club.phone || 'N/A'}
                    </Text>
                    <Text style={styles.footerSub}>Generated by NightPulse Invoice System</Text>
                </View>
            </Page>
        </Document>
    );
}

export async function generateInvoicePDF(
    invoice: InvoiceData,
    isReceipt: boolean
): Promise<Buffer> {
    const element = React.createElement(
        InvoicePDF,
        { invoice, isReceipt }
    ) as unknown as ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(element);
    return Buffer.from(buffer);
}
