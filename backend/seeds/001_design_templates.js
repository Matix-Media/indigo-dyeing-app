import { randomUUID } from 'node:crypto';

export async function seed(knex) {
    await knex('design_templates').del();

    const templates = [
        {
            id: randomUUID(),
            name: 'Classic Geometric',
            image_url: '/templates/geometric.png',
            category: 'geometric',
            description: 'Traditional geometric pattern inspired by Japanese indigo designs',
            svg_data: '<svg></svg>',
        },
        {
            id: randomUUID(),
            name: 'Tie-Dye Circle',
            image_url: '/templates/tie-dye.png',
            category: 'tie-dye',
            description: 'Classic tie-dye circular pattern',
            svg_data: '<svg></svg>',
        },
        {
            id: randomUUID(),
            name: 'Nature Leaves',
            image_url: '/templates/leaves.png',
            category: 'nature',
            description: 'Natural leaf and plant motifs',
            svg_data: '<svg></svg>',
        },
        {
            id: randomUUID(),
            name: 'Stripes Bold',
            image_url: '/templates/stripes.png',
            category: 'pattern',
            description: 'Bold horizontal and vertical stripes',
            svg_data: '<svg></svg>',
        },
        {
            id: randomUUID(),
            name: 'Floral Traditional',
            image_url: '/templates/floral.png',
            category: 'floral',
            description: 'Traditional floral patterns',
            svg_data: '<svg></svg>',
        },
        {
            id: randomUUID(),
            name: 'Wave Motion',
            image_url: '/templates/waves.png',
            category: 'nature',
            description: 'Flowing wave patterns representing water',
            svg_data: '<svg></svg>',
        },
        {
            id: randomUUID(),
            name: 'Dots Scattered',
            image_url: '/templates/dots.png',
            category: 'geometric',
            description: 'Scattered dot pattern',
            svg_data: '<svg></svg>',
        },
        {
            id: randomUUID(),
            name: 'Spiral Energy',
            image_url: '/templates/spiral.png',
            category: 'abstract',
            description: 'Dynamic spiral and circular patterns',
            svg_data: '<svg></svg>',
        },
    ];

    await knex('design_templates').insert(templates);
}
