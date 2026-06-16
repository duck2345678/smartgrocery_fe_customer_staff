import { describe, expect, it } from 'vitest';
import {
  administrativeProvinces,
  findProvinceByName,
  findWardByName,
} from './vietnamAdministrativeUnits';

describe('vietnamAdministrativeUnits', () => {
  it('loads provinces with dependent wards', () => {
    expect(administrativeProvinces.length).toBeGreaterThan(0);

    const hoChiMinh = findProvinceByName('Thành phố Hồ Chí Minh');
    expect(hoChiMinh).toBeDefined();
    expect(hoChiMinh?.wards.length).toBeGreaterThan(0);
    expect(hoChiMinh?.wards.every((ward) => ward.provinceCode === hoChiMinh.code)).toBe(true);
  });

  it('matches common abbreviated province names', () => {
    expect(findProvinceByName('TP. Hồ Chí Minh')?.name).toBe('Thành phố Hồ Chí Minh');
    expect(findProvinceByName('Hồ Chí Minh')?.name).toBe('Thành phố Hồ Chí Minh');
  });

  it('only returns wards within the selected province', () => {
    const haNoi = findProvinceByName('Thành phố Hà Nội');
    const hoChiMinh = findProvinceByName('Thành phố Hồ Chí Minh');

    expect(haNoi).toBeDefined();
    expect(hoChiMinh).toBeDefined();

    const haNoiWard = haNoi?.wards[0];
    expect(haNoiWard).toBeDefined();
    expect(findWardByName(hoChiMinh?.code, haNoiWard?.name ?? '')).toBeUndefined();
    expect(findWardByName(haNoi?.code, haNoiWard?.name ?? '')?.provinceCode).toBe(haNoi?.code);
  });
});
