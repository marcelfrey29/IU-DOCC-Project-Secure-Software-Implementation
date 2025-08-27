import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Recipe {
    constructor(id: number, ownerUserId: string) {
        this.id = id;
        this.ownerUserId = ownerUserId;
    }

    @PrimaryGeneratedColumn({ type: "int" })
    id: number;

    @Column({ type: "text" })
    ownerUserId: string;
}
