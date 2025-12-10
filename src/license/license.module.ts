import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { License } from './licnese.entity';

@Module({
    imports : [
        TypeOrmModule.forFeature([License])
    ]
})
export class LicenseModule {}
