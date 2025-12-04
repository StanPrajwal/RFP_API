import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class RegisterVendorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export { RegisterVendorDto };
