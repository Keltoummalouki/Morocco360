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
import { CountriesService } from './countries.service';
import {
  AssignLanguagesDto,
  CreateCountryDto,
  QueryCountryDto,
  UpdateCountryDto,
} from './dto/country.dto';

@ApiTags('Admin · Settings · Countries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/settings/countries')
export class CountriesController {
  constructor(private readonly service: CountriesService) {}

  @Get()
  @ApiOperation({ summary: 'List countries (paginated, search, filter)' })
  list(@Query() query: QueryCountryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one country with its cities and languages' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/cities')
  @ApiOperation({ summary: 'List cities of a country' })
  getCities(@Param('id', ParseIntPipe) id: number) {
    return this.service.getCities(id);
  }

  @Get(':id/languages')
  @ApiOperation({ summary: 'List languages of a country' })
  getLanguages(@Param('id', ParseIntPipe) id: number) {
    return this.service.getLanguages(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a country' })
  create(@Body() dto: CreateCountryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a country' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCountryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Put(':id/languages')
  @ApiOperation({ summary: 'Set the languages spoken in a country' })
  assignLanguages(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignLanguagesDto,
  ) {
    return this.service.assignLanguages(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a country (only when it has no cities)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
