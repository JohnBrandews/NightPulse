export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');
    const role = currentUser.role;

    const where: any = {};

    if (role === 'admin') {
      if (clubId) where.clubId = clubId;
    } else if (role === 'club') {
      // Get all clubs owned by current user
      const clubs = await prisma.club.findMany({
        where: { ownerId: currentUser.userId },
        select: { id: true },
      });

      if (clubs.length === 0) {
        return NextResponse.json({
          analytics: {
            totalRevenue: 0,
            totalInvoices: 0,
            paidInvoices: 0,
            pendingInvoices: 0,
            overdraftInvoices: 0,
            averageMonthlyRevenue: 0,
            monthlyData: [],
            statusBreakdown: [],
            recentTransactions: [],
          }
        });
      }

      const clubIds = clubs.map(c => c.id);

      if (clubId && clubIds.includes(clubId)) {
        where.clubId = clubId;
      } else {
        where.clubId = { in: clubIds };
      }
    } else {
      // Regular users see their own analytics? (Usually not, but for safety)
      where.userId = currentUser.userId;
    }

    // Get all invoices based on filter
    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        totalAmount: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        issueDate: true,
        emailSent: true,
        invoiceNumber: true,
        clientName: true,
      },
    });

    // Calculate metrics
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending' && inv.emailSent).length;
    const overdraftInvoices = invoices.filter(inv => inv.status === 'overdraft' || inv.paymentStatus === 'overdue').length;
    const draftInvoices = invoices.filter(inv => inv.status === 'pending' && !inv.emailSent).length;

    // Status breakdown for Chart
    const statusBreakdown = [
      { id: 'paid', label: 'Paid', value: paidInvoices, color: '#10b981' }, // green-500
      { id: 'pending', label: 'Pending', value: pendingInvoices, color: '#f59e0b' }, // amber-500
      { id: 'overdue', label: 'Overdue', value: overdraftInvoices, color: '#ef4444' }, // red-500
      { id: 'draft', label: 'Draft', value: draftInvoices, color: '#64748b' }, // slate-500
    ];

    // Calculate monthly revenue data (last 12 months)
    const now = new Date();
    const monthlyData: Array<{ month: string; revenue: number; invoices: number }> = [];

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthLabel = monthDate.toLocaleDateString('en-KE', { month: 'short' });

      const monthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.issueDate);
        return invDate >= monthDate && invDate <= monthEnd;
      });

      const monthRevenue = monthInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      monthlyData.push({
        month: monthLabel,
        revenue: monthRevenue,
        invoices: monthInvoices.length,
      });
    }

    // Calculate average monthly revenue
    const paidInvoicesList = invoices.filter(inv => inv.status === 'paid');
    let averageMonthlyRevenue = 0;

    if (paidInvoicesList.length > 0) {
      // Find the date range of paid invoices
      const dates = paidInvoicesList.map(inv => new Date(inv.issueDate).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));

      // Calculate number of months
      const monthsDiff = (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
        (maxDate.getMonth() - minDate.getMonth()) + 1;

      averageMonthlyRevenue = monthsDiff > 0 ? totalRevenue / monthsDiff : totalRevenue;
    }

    // Get recent transactions
    const recentTransactions = invoices
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return NextResponse.json({
      analytics: {
        totalRevenue,
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        overdraftInvoices,
        draftInvoices,
        averageMonthlyRevenue,
        monthlyData,
        statusBreakdown,
        recentTransactions,
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
  }
}
