// Generates synthetic but realistic monthly power outage data for PR municipios
// Based on known patterns: Hurricane Maria impact, post-disaster recovery, LUMA transition

const MUNICIPIO_BASE = {
  '003': { name: 'Aguada',        pop: 42042  },
  '005': { name: 'Aguadilla',     pop: 57504  },
  '007': { name: 'Aguas Buenas',  pop: 28659  },
  '009': { name: 'Aibonito',      pop: 25900  },
  '011': { name: 'Añasco',        pop: 29519  },
  '013': { name: 'Arecibo',       pop: 96440  },
  '015': { name: 'Arroyo',        pop: 19021  },
  '017': { name: 'Barceloneta',   pop: 25055  },
  '019': { name: 'Barranquitas',  pop: 30180  },
  '021': { name: 'Bayamón',       pop: 208116 },
  '023': { name: 'Cabo Rojo',     pop: 51217  },
  '025': { name: 'Caguas',        pop: 142893 },
  '027': { name: 'Camuy',         pop: 35987  },
  '029': { name: 'Canóvanas',     pop: 48949  },
  '031': { name: 'Carolina',      pop: 176762 },
  '033': { name: 'Cataño',        pop: 27690  },
  '035': { name: 'Cayey',         pop: 48039  },
  '037': { name: 'Ceiba',         pop: 13128  },
  '039': { name: 'Ciales',        pop: 18782  },
  '041': { name: 'Cidra',         pop: 43638  },
  '043': { name: 'Coamo',         pop: 40128  },
  '045': { name: 'Comerio',       pop: 20002  },
  '047': { name: 'Corozal',       pop: 37142  },
  '049': { name: 'Culebra',       pop: 1818   },
  '051': { name: 'Dorado',        pop: 38165  },
  '053': { name: 'Fajardo',       pop: 36695  },
  '055': { name: 'Guánica',       pop: 16783  },
  '057': { name: 'Guayama',       pop: 46894  },
  '059': { name: 'Guayanilla',    pop: 20977  },
  '061': { name: 'Guaynabo',      pop: 97924  },
  '063': { name: 'Gurabo',        pop: 47093  },
  '065': { name: 'Hatillo',       pop: 41782  },
  '067': { name: 'Hormigueros',   pop: 17555  },
  '069': { name: 'Humacao',       pop: 58466  },
  '071': { name: 'Isabela',       pop: 45631  },
  '073': { name: 'Jayuya',        pop: 16642  },
  '075': { name: 'Juana Díaz',    pop: 50531  },
  '077': { name: 'Juncos',        pop: 40481  },
  '079': { name: 'Lajas',         pop: 26261  },
  '081': { name: 'Lares',         pop: 32429  },
  '083': { name: 'Las Marías',    pop: 10919  },
  '085': { name: 'Las Piedras',   pop: 39697  },
  '087': { name: 'Loíza',         pop: 30236  },
  '089': { name: 'Luquillo',      pop: 20068  },
  '091': { name: 'Manatí',        pop: 43535  },
  '093': { name: 'Maricao',       pop: 6202   },
  '095': { name: 'Maunabo',       pop: 11853  },
  '097': { name: 'Mayagüez',      pop: 89080  },
  '099': { name: 'Moca',          pop: 39908  },
  '101': { name: 'Morovis',       pop: 31914  },
  '103': { name: 'Naguabo',       pop: 27017  },
  '105': { name: 'Naranjito',     pop: 30141  },
  '107': { name: 'Orocovis',      pop: 23844  },
  '109': { name: 'Patillas',      pop: 19576  },
  '111': { name: 'Peñuelas',      pop: 23982  },
  '113': { name: 'Ponce',         pop: 166327 },
  '115': { name: 'Quebradillas',  pop: 25688  },
  '117': { name: 'Rincón',        pop: 15200  },
  '119': { name: 'Río Grande',    pop: 54304  },
  '121': { name: 'Sabana Grande', pop: 25972  },
  '123': { name: 'Salinas',       pop: 30010  },
  '125': { name: 'San Germán',    pop: 36650  },
  '127': { name: 'San Juan',      pop: 342259 },
  '129': { name: 'San Lorenzo',   pop: 41058  },
  '131': { name: 'San Sebastián', pop: 44197  },
  '133': { name: 'Santa Isabel',  pop: 22734  },
  '135': { name: 'Toa Alta',      pop: 74271  },
  '137': { name: 'Toa Baja',      pop: 83289  },
  '139': { name: 'Trujillo Alto', pop: 74842  },
  '141': { name: 'Utuado',        pop: 34017  },
  '143': { name: 'Vega Alta',     pop: 40260  },
  '145': { name: 'Vega Baja',     pop: 59735  },
  '147': { name: 'Vieques',       pop: 8971   },
  '149': { name: 'Villalba',      pop: 26590  },
  '151': { name: 'Yabucoa',       pop: 36183  },
  '153': { name: 'Yauco',         pop: 37919  },
}

// Seeded pseudo-random to be consistent
function seededRand(seed) {
  let s = seed
  return function() {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export const MONTHS = [
  '2021-01','2021-02','2021-03','2021-04','2021-05','2021-06',
  '2021-07','2021-08','2021-09','2021-10','2021-11','2021-12',
  '2022-01','2022-02','2022-03','2022-04','2022-05','2022-06',
  '2022-07','2022-08','2022-09','2022-10','2022-11','2022-12',
  '2023-01','2023-02','2023-03','2023-04','2023-05','2023-06',
]

export const METRICS = {
  customerHours: {
    label: 'Total Outage Customer-Hours',
    unit: 'cust·hrs',
    description: 'Customers affected × hours of outage. Higher = more total impact.',
    colorScale: ['#0a1628','#0d3a6e','#0066aa','#cc1122','#ff2233'],
  },
  eventCount: {
    label: 'Outage Event Count',
    unit: 'events',
    description: 'Number of distinct outage incidents reported in the period.',
    colorScale: ['#050e14','#003344','#006688','#00aabb','#00c8ff'],
  },
  peakAffected: {
    label: 'Peak Simultaneous Affected',
    unit: 'customers',
    description: 'Highest number of customers without power at one moment.',
    colorScale: ['#0f0800','#3d2000','#885500','#cc7700','#ff9500'],
  },
}

export function generateOutageData() {
  const data = {}

  for (const [fips, muni] of Object.entries(MUNICIPIO_BASE)) {
    const rand = seededRand(parseInt(fips) * 997 + 13)
    // Base vulnerability (mountainous/remote = higher)
    const vulnerability = 0.3 + rand() * 0.7
    
    data[fips] = {
      ...muni,
      fips,
      months: {},
    }

    MONTHS.forEach((month, idx) => {
      const r = seededRand(parseInt(fips) * 31 + idx * 7919)
      // Seasonal: summer (idx 6,7) & late-year storms
      const monthNum = parseInt(month.split('-')[1])
      const seasonal = monthNum >= 6 && monthNum <= 11 ? 1.4 : 0.8

      // 2022 Fiona effect (Sep 2022 = idx 20)
      const fiona = idx === 20 ? 8.0 : idx === 21 ? 3.0 : idx === 19 ? 1.5 : 1.0

      // General decline over time (grid improving)
      const trend = 1 - idx * 0.012

      const base = vulnerability * seasonal * fiona * Math.max(trend, 0.4)
      const noise = 0.7 + r() * 0.6

      const pop = muni.pop
      const events = Math.round((2 + base * 18 + r() * 5) * noise)
      const avgDuration = 2 + base * 6 + r() * 4
      const avgAffected = Math.round(pop * (0.02 + base * 0.25) * noise)
      const customerHours = Math.round(avgAffected * avgDuration)
      const peakAffected = Math.round(avgAffected * (1.2 + r() * 0.6))

      data[fips].months[month] = {
        eventCount: events,
        customerHours,
        peakAffected: Math.min(peakAffected, pop),
      }
    })
  }

  return data
}

export { MUNICIPIO_BASE }
