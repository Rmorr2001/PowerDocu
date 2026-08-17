import { writeFile } from 'node:fs/promises';
import { strToU8, zipSync } from 'fflate';

const appControl = (name: string, type: string, id: string) =>
  JSON.stringify({
    TopParent: {
      Name: name,
      Template: { Id: id, Version: '1.0', Name: type },
      Rules: [],
      Children: [],
    },
  });

export function createSyntheticMsapp(): Uint8Array {
  const files: Record<string, Uint8Array> = {
    'Header.json': strToU8('{}'),
    'Properties.json': strToU8(
      JSON.stringify({
        AppName: 'Synthetic Canvas',
        ID: '00000000-0000-0000-0000-000000000001',
        ControlCount: 2,
        AppPreviewFlagsMap: {},
      }),
    ),
    'Resources\\PublishInfo.json': strToU8(
      JSON.stringify({
        AppName: 'Synthetic Canvas',
        BackgroundColor: 'RGBA(255,255,255,1)',
        IconColor: 'RGBA(0,0,0,1)',
        IconName: 'Document',
        LogoFileName: '',
      }),
    ),
    'Controls\\1.json': strToU8(
      appControl('App', 'appinfo', 'http://microsoft.com/appmagic/appinfo'),
    ),
    'Controls\\2.json': strToU8(
      appControl('Screen One', 'screen', 'http://microsoft.com/appmagic/screen'),
    ),
    'References\\DataSources.json': strToU8('{"DataSources":[]}'),
    'References\\Resources.json': strToU8('{"Resources":[]}'),
  };
  return zipSync(files, { level: 1 });
}

export async function writeSyntheticMsapp(path: string): Promise<void> {
  await writeFile(path, createSyntheticMsapp());
}
