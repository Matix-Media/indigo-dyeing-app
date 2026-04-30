import { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("design_templates").del();

    // Inserts seed entries for design templates
    const templates = [
        {
            id: uuidv4(),
            name: "Classic Geometric",
            image_url: "/templates/geometric.png",
            category: "geometric",
            description: "Traditional geometric pattern inspired by Japanese indigo designs",
            svg_data: "<svg></svg>", // Placeholder
        },
        {
            id: uuidv4(),
            name: "Tie-Dye Circle",
            image_url: "/templates/tie-dye.png",
            category: "tie-dye",
            description: "Classic tie-dye circular pattern",
            svg_data: "<svg></svg>",
        },
        {
            id: uuidv4(),
            name: "Nature Leaves",
            image_url: "/templates/leaves.png",
            category: "nature",
            description: "Natural leaf and plant motifs",
            svg_data: "<svg></svg>",
        },
        {
            id: uuidv4(),
            name: "Stripes Bold",
            image_url: "/templates/stripes.png",
            category: "pattern",
            description: "Bold horizontal and vertical stripes",
            svg_data: "<svg></svg>",
        },
        {
            id: uuidv4(),
            name: "Floral Traditional",
            image_url: "/templates/floral.png",
            category: "floral",
            description: "Traditional floral patterns",
            svg_data: "<svg></svg>",
        },
        {
            id: uuidv4(),
            name: "Wave Motion",
            image_url: "/templates/waves.png",
            category: "nature",
            description: "Flowing wave patterns representing water",
            svg_data: "<svg></svg>",
        },
        {
            id: uuidv4(),
            name: "Dots Scattered",
            image_url: "/templates/dots.png",
            category: "geometric",
            description: "Scattered dot pattern",
            svg_data: "<svg></svg>",
        },
        {
            id: uuidv4(),
            name: "Spiral Energy",
            image_url: "/templates/spiral.png",
            category: "abstract",
            description: "Dynamic spiral and circular patterns",
            svg_data: "<svg></svg>",
        },
    ];

    await knex("design_templates").insert(templates);
}
