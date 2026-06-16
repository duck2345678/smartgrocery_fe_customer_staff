import rawAdministrativeUnits from './vietnamAdministrativeUnits.json';

export type AdministrativeWard = {
  code: string;
  name: string;
  provinceCode: string;
};

export type AdministrativeProvince = {
  code: string;
  name: string;
  wards: AdministrativeWard[];
};

type RawWard = {
  Code: string;
  FullName: string;
  ProvinceCode: string;
};

type RawProvince = {
  Code: string;
  FullName: string;
  Wards: RawWard[];
};

export const administrativeProvinces: AdministrativeProvince[] = (rawAdministrativeUnits as RawProvince[]).map(
  (province) => ({
    code: province.Code,
    name: province.FullName,
    wards: province.Wards.map((ward) => ({
      code: ward.Code,
      name: ward.FullName,
      provinceCode: ward.ProvinceCode,
    })),
  }),
);

export const normalizeAdministrativeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

const normalizeAdministrativeName = (value: string) =>
  normalizeAdministrativeSearch(value)
    .replace(/^tp\.?\s+/, '')
    .replace(/^thanh pho\s+/, '')
    .replace(/^tinh\s+/, '')
    .trim();

export const findProvinceByName = (name: string) =>
  administrativeProvinces.find((province) => {
    const provinceName = normalizeAdministrativeName(province.name);
    const inputName = normalizeAdministrativeName(name);
    return province.name === name || provinceName === inputName;
  });

export const findWardByName = (provinceCode: string | undefined, name: string) =>
  administrativeProvinces
    .find((province) => province.code === provinceCode)
    ?.wards.find((ward) => ward.name === name);
