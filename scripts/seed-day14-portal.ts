import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Day 14 Branded Tenant Portals (Sunshine Solar & GreenPower)...');

  // 1. Sunshine Solar Ltd
  const sunshineBranding = {
    primaryColor: '#006937', // Heritage Emerald / Solar Green
    secondaryColor: '#004d28',
    logoUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=160&auto=format&fit=crop&q=80',
    darkLogoUrl: '',
    faviconUrl: '',
  };

  const sunshineProfile = {
    companyName: 'Sunshine Solar Ltd',
    phone: '+234 800 786 7446',
    address: 'Plot 14 Victoria Island, Commercial Avenue',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    currency: 'NGN',
    industry: 'Solar & Renewable Energy',
    taxRate: 7.5,
    timezone: 'Africa/Lagos',
    website: 'https://sunshinesolar.ng',
  };

  const sunshinePortal = {
    enabled: true,
    welcomeMessage: 'Welcome to Sunshine Solar Client Care. Monitor clean power generation, book servicing, and review quotes.',
    allowQuotes: true,
    allowInvoices: true,
    allowPayments: true,
    allowServiceRequests: true,
    allowWarranties: true,
    supportEmail: 'support@sunshinesolar.ng',
    supportPhone: '+234 800 786 7446',
  };

  const sunshine = await prisma.tenant.upsert({
    where: { slug: 'sunshine-solar' },
    update: {
      name: 'Sunshine Solar Ltd',
      settings: {
        upsert: {
          create: {
            businessProfile: sunshineProfile,
            branding: sunshineBranding,
            portal: sunshinePortal,
          },
          update: {
            businessProfile: sunshineProfile,
            branding: sunshineBranding,
            portal: sunshinePortal,
          },
        },
      },
    },
    create: {
      name: 'Sunshine Solar Ltd',
      slug: 'sunshine-solar',
      settings: {
        create: {
          businessProfile: sunshineProfile,
          branding: sunshineBranding,
          portal: sunshinePortal,
        },
      },
    },
    include: { settings: true },
  });
  console.log(`✓ Sunshine Solar ready (${sunshine.id}) - Color: ${sunshineBranding.primaryColor}`);

  // 2. GreenPower Energy Ltd
  const greenpowerBranding = {
    primaryColor: '#0284c7', // Vibrant Azure / Clean Microgrid Blue
    secondaryColor: '#0369a1',
    logoUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=160&auto=format&fit=crop&q=80',
    darkLogoUrl: '',
    faviconUrl: '',
  };

  const greenpowerProfile = {
    companyName: 'GreenPower Energy Ltd',
    phone: '+234 802 999 4455',
    address: '42 Silicon Valley Boulevard, Central Business District',
    city: 'Abuja',
    state: 'FCT',
    country: 'Nigeria',
    currency: 'NGN',
    industry: 'Smart Hybrid Microgrids & Storage',
    taxRate: 7.5,
    timezone: 'Africa/Lagos',
    website: 'https://greenpower.ng',
  };

  const greenpowerPortal = {
    enabled: true,
    welcomeMessage: 'Welcome to GreenPower Energy. Next-generation hybrid power management and 24/7 proactive field monitoring.',
    allowQuotes: true,
    allowInvoices: true,
    allowPayments: true,
    allowServiceRequests: true,
    allowWarranties: true,
    supportEmail: 'dispatch@greenpower.ng',
    supportPhone: '+234 802 999 4455',
  };

  const greenpower = await prisma.tenant.upsert({
    where: { slug: 'greenpower' },
    update: {
      name: 'GreenPower Energy Ltd',
      settings: {
        upsert: {
          create: {
            businessProfile: greenpowerProfile,
            branding: greenpowerBranding,
            portal: greenpowerPortal,
          },
          update: {
            businessProfile: greenpowerProfile,
            branding: greenpowerBranding,
            portal: greenpowerPortal,
          },
        },
      },
    },
    create: {
      name: 'GreenPower Energy Ltd',
      slug: 'greenpower',
      settings: {
        create: {
          businessProfile: greenpowerProfile,
          branding: greenpowerBranding,
          portal: greenpowerPortal,
        },
      },
    },
    include: { settings: true },
  });
  console.log(`✓ GreenPower Energy ready (${greenpower.id}) - Color: ${greenpowerBranding.primaryColor}`);

  console.log('Day 14 Portal Seeding Complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
