import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class RecipeComment {
    constructor(
        id: number,
        recipeId: number,
        ownerUserId: string,
        comment: string,
    ) {
        this.id = id;
        this.recipeId = recipeId;
        this.ownerUserId = ownerUserId;
        this.comment = comment;
    }

    @PrimaryGeneratedColumn({ type: "int" })
    id: number;

    // NOTE: We don't create a relation for simplicity. In a real-world app using a Relation DB
    // a OneToMany/ManyToOne Relation should be used. For simplicity this is ommited and we use
    // some NoSQL-Style here. This of course has some downsides: If a recipe is deleted, comments
    // for this recipe remain in the DB as stale data.
    @Column({ type: "int" })
    recipeId: number;

    @Column({ type: "text" })
    ownerUserId: string;

    @Column({ type: "text" })
    comment: string;
}
