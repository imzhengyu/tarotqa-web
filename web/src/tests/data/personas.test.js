import { describe, it, expect } from 'vitest';
import { personas, getPersona } from '../../data/personas';
import { PERSONA_IDS } from '../../constants';

describe('personas', () => {
  it('getPersona 返回指定角色，未知 id 回退到 general', () => {
    for (const id of Object.values(PERSONA_IDS)) {
      const persona = getPersona(id);
      expect(persona).toBeDefined();
      expect(persona.description.length).toBeGreaterThan(5);
    }

    expect(getPersona('not-a-persona')).toBe(personas.general);
  });
});
