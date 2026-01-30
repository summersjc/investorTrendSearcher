import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample investors
  const sequoia = await prisma.investor.create({
    data: {
      name: 'Sequoia Capital',
      slug: 'sequoia-capital',
      type: 'VC_FIRM',
      description:
        'Sequoia Capital is a venture capital firm that helps daring founders build legendary companies.',
      website: 'https://www.sequoiacap.com',
      city: 'Menlo Park',
      state: 'CA',
      country: 'USA',
      foundedYear: 1972,
      dataSource: 'MANUAL',
    },
  });

  const a16z = await prisma.investor.create({
    data: {
      name: 'Andreessen Horowitz',
      slug: 'andreessen-horowitz',
      type: 'VC_FIRM',
      description:
        'Andreessen Horowitz (a16z) is a venture capital firm backing bold entrepreneurs building the future.',
      website: 'https://a16z.com',
      city: 'Menlo Park',
      state: 'CA',
      country: 'USA',
      foundedYear: 2009,
      dataSource: 'MANUAL',
    },
  });

  const benchmark = await prisma.investor.create({
    data: {
      name: 'Benchmark',
      slug: 'benchmark',
      type: 'VC_FIRM',
      description: 'Benchmark is a venture capital firm focused on early-stage investments.',
      website: 'https://www.benchmark.com',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      foundedYear: 1995,
      dataSource: 'MANUAL',
    },
  });

  // Create sample companies
  const airbnb = await prisma.company.create({
    data: {
      name: 'Airbnb',
      slug: 'airbnb',
      type: 'PUBLIC',
      stage: 'PUBLIC',
      description: 'Airbnb is an online marketplace for short-term home and apartment rentals.',
      website: 'https://www.airbnb.com',
      headquarters: 'San Francisco, CA',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      industry: 'Travel & Hospitality',
      sector: 'Technology',
      foundedYear: 2008,
      ticker: 'ABNB',
      exchange: 'NASDAQ',
      dataSource: 'MANUAL',
    },
  });

  const stripe = await prisma.company.create({
    data: {
      name: 'Stripe',
      slug: 'stripe',
      type: 'PRIVATE',
      stage: 'GROWTH',
      description:
        'Stripe is a technology company that builds economic infrastructure for the internet.',
      website: 'https://stripe.com',
      headquarters: 'San Francisco, CA',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      industry: 'Financial Services',
      sector: 'Technology',
      foundedYear: 2010,
      dataSource: 'MANUAL',
    },
  });

  const notion = await prisma.company.create({
    data: {
      name: 'Notion',
      slug: 'notion',
      type: 'PRIVATE',
      stage: 'GROWTH',
      description: 'Notion is a productivity and note-taking web application.',
      website: 'https://www.notion.so',
      headquarters: 'San Francisco, CA',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      industry: 'Productivity Software',
      sector: 'Technology',
      foundedYear: 2016,
      dataSource: 'MANUAL',
    },
  });

  // Create sample investments
  await prisma.investment.create({
    data: {
      investorId: sequoia.id,
      companyId: airbnb.id,
      stage: 'SEED',
      status: 'IPO',
      amount: 600000,
      investedAt: new Date('2009-04-01'),
      leadInvestor: true,
      dataSource: 'MANUAL',
    },
  });

  await prisma.investment.create({
    data: {
      investorId: sequoia.id,
      companyId: stripe.id,
      stage: 'SERIES_A',
      status: 'ACTIVE',
      amount: 2000000,
      investedAt: new Date('2011-05-01'),
      leadInvestor: false,
      dataSource: 'MANUAL',
    },
  });

  await prisma.investment.create({
    data: {
      investorId: a16z.id,
      companyId: airbnb.id,
      stage: 'SERIES_B',
      status: 'IPO',
      amount: 60000000,
      investedAt: new Date('2011-07-01'),
      leadInvestor: true,
      dataSource: 'MANUAL',
    },
  });

  await prisma.investment.create({
    data: {
      investorId: benchmark.id,
      companyId: notion.id,
      stage: 'SERIES_A',
      status: 'ACTIVE',
      investedAt: new Date('2018-04-01'),
      leadInvestor: true,
      dataSource: 'MANUAL',
    },
  });

  // Create portfolio companies
  await prisma.portfolioCompany.create({
    data: {
      investorId: sequoia.id,
      companyId: airbnb.id,
      status: 'IPO',
    },
  });

  await prisma.portfolioCompany.create({
    data: {
      investorId: sequoia.id,
      companyId: stripe.id,
      status: 'ACTIVE',
    },
  });

  await prisma.portfolioCompany.create({
    data: {
      investorId: a16z.id,
      companyId: airbnb.id,
      status: 'IPO',
    },
  });

  await prisma.portfolioCompany.create({
    data: {
      investorId: benchmark.id,
      companyId: notion.id,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Created ${await prisma.investor.count()} investors`);
  console.log(`Created ${await prisma.company.count()} companies`);
  console.log(`Created ${await prisma.investment.count()} investments`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
