import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // Users table
    await knex.schema.createTable("users", (table) => {
        table.uuid("id").primary();
        table.string("email").unique().notNullable();
        table.string("password").notNullable();
        table.string("name").notNullable();
        table.enum("role", ["user", "workshop", "admin"]).defaultTo("user");
        table.string("avatar");
        table.timestamps(true, true);
    });

    // Workshops table
    await knex.schema.createTable("workshops", (table) => {
        table.uuid("id").primary();
        table.string("name").notNullable();
        table.string("location").notNullable();
        table.string("city").notNullable();
        table.text("description");
        table.uuid("owner_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.string("phone");
        table.string("email");
        table.decimal("rating", 3, 2).defaultTo(0);
        table.integer("review_count").defaultTo(0);
        table.string("image_url");
        table.boolean("active").defaultTo(true);
        table.timestamps(true, true);
    });

    // Design templates table
    await knex.schema.createTable("design_templates", (table) => {
        table.uuid("id").primary();
        table.string("name").notNullable();
        table.string("image_url").notNullable();
        table.string("category");
        table.text("svg_data");
        table.text("description");
        table.timestamps(true, true);
    });

    // Designs table
    await knex.schema.createTable("designs", (table) => {
        table.uuid("id").primary();
        table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.string("name");
        table.json("customization").notNullable();
        table.string("image_url").notNullable();
        table.timestamps(true, true);
    });

    // Bookings table
    await knex.schema.createTable("bookings", (table) => {
        table.uuid("id").primary();
        table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.uuid("workshop_id").notNullable().references("id").inTable("workshops").onDelete("CASCADE");
        table.uuid("design_id").references("id").inTable("designs").onDelete("SET NULL");
        table.date("date").notNullable();
        table.string("time_slot").notNullable();
        table.integer("participant_count").defaultTo(1);
        table.enum("status", ["pending", "paid", "confirmed", "completed", "cancelled"]).defaultTo("pending");
        table.decimal("price", 10, 2).notNullable();
        table.string("stripe_payment_id");
        table.timestamps(true, true);
    });

    // Reviews table
    await knex.schema.createTable("reviews", (table) => {
        table.uuid("id").primary();
        table.uuid("booking_id").notNullable().references("id").inTable("bookings").onDelete("CASCADE");
        table.uuid("workshop_id").notNullable().references("id").inTable("workshops").onDelete("CASCADE");
        table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.integer("rating").notNullable(); // 1-5
        table.text("comment");
        table.timestamps(true, true);
    });

    // Workshop availability table
    await knex.schema.createTable("workshop_availability", (table) => {
        table.uuid("id").primary();
        table.uuid("workshop_id").notNullable().references("id").inTable("workshops").onDelete("CASCADE");
        table.date("date").notNullable();
        table.string("time_slot").notNullable(); // e.g., "09:00-12:00"
        table.integer("max_participants").defaultTo(1);
        table.integer("available_spots").notNullable();
        table.boolean("is_booked").defaultTo(false);
        table.timestamps(true, true);
        table.unique(["workshop_id", "date", "time_slot"]);
    });

    // Create indices for performance
    await knex.schema.table("bookings", (table) => {
        table.index("user_id");
        table.index("workshop_id");
        table.index("date");
    });

    await knex.schema.table("designs", (table) => {
        table.index("user_id");
    });

    await knex.schema.table("reviews", (table) => {
        table.index("workshop_id");
        table.index("user_id");
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("reviews");
    await knex.schema.dropTableIfExists("workshop_availability");
    await knex.schema.dropTableIfExists("bookings");
    await knex.schema.dropTableIfExists("designs");
    await knex.schema.dropTableIfExists("design_templates");
    await knex.schema.dropTableIfExists("workshops");
    await knex.schema.dropTableIfExists("users");
}
