import { IsNotEmpty, IsString } from "class-validator";

export class CreateGroupDto {
    @IsString()
    @IsNotEmpty()
    groupName: string;
}