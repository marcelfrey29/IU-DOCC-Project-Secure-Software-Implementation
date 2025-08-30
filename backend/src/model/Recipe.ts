import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Recipe {
    constructor(
        id: number,
        ownerUserId: string,
        title: string,
        description: string,
        ingredients: string,
        steps: string,
    ) {
        this.id = id;
        this.ownerUserId = ownerUserId;
        this.title = title;
        this.description = description;
        this.ingredients = ingredients;
        this.steps = steps;
    }

    @PrimaryGeneratedColumn({ type: "int" })
    id: number;

    @Column({ type: "text" })
    ownerUserId: string;

    @Column({ type: "text" })
    title: string;

    @Column({ type: "text" })
    description: string;

    // We'll store the ingredients as JSON-encoded string for simplicity
    @Column({ type: "text" })
    ingredients: string;

    // We'll store the steps as JSON-encoded string for simplicity
    @Column({ type: "text" })
    steps: string;
}
