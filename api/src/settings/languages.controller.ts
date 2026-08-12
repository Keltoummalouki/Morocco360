import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LanguagesService } from './languages.service';
import {
  AssignCountriesDto,
  CreateLanguageDto,
  QueryLanguageDto,
  UpdateLanguageDto,
} from './dto/language.dto';

@ApiTags('Admin · Settings · Languages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/settings/languages')
export class LanguagesController {
  constructor(private readonly service: LanguagesService) {}

  @Get()
  @ApiOperation({ summary: 'List languages (paginated, search, filter)' })
  list(@Query() query: QueryLanguageDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one language with its countries' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a language' })
  create(@Body() dto: CreateLanguageDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a language' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLanguageDto,
  ) {
    return this.service.update(id, dto);
  }

  @Put(':id/countries')
  @ApiOperation({ summary: 'Set the countries that speak this language' })
  assignCountries(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignCountriesDto,
  ) {
    return this.service.assignCountries(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a language' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
