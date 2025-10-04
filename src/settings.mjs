const sceneConfig = foundry?.applications?.sheets?.SceneConfig ?? SceneConfig;

export const registerSettings = async () => {

  game.settings.register('scene-express', 'enableSceneExpress', {
    name: 'SCENE_EXPRESS.ENABLE',
    hint: 'SCENE_EXPRESS.ENABLE_HINT',
    scope: 'world',
    config: true,
    requiresReload: true,
    type: Boolean,
    default: true
  });

  game.settings.register('scene-express', 'fileExistsBehavior', {
    name: 'SCENE_EXPRESS.FILE_EXISTS_BEHAVIOR',
    hint: 'SCENE_EXPRESS.FILE_EXISTS_BEHAVIOR_HINT',
    scope: 'world',
    config: true,
    type: Number,
    choices: {
      1: 'SCENE_EXPRESS.FILE_EXISTS_BEHAVIOR_1',
      2: 'SCENE_EXPRESS.FILE_EXISTS_BEHAVIOR_2',
      3: 'SCENE_EXPRESS.FILE_EXISTS_BEHAVIOR_3',
    },
    default: 1
  });

  game.settings.register('scene-express', 'activateImmediately', {
    name: 'SCENE_EXPRESS.IMMEDIATELY_ACTIVE',
    hint: 'SCENE_EXPRESS.IMMEDIATELY_ACTIVE_HINT',
    scope: 'world',
    config: true,
    type: Boolean,
    default: 'false'
  });

  game.settings.register('scene-express', 'defaultGridType', {
    name: 'SCENE_EXPRESS.GRID.TYPE.LABEL',
    scope: 'world',
    config: true,
    type: Number,
    choices: sceneConfig._getGridTypes(),
  });

  game.settings.register('scene-express', 'defaultGridSize', {
    name: 'SCENE_EXPRESS.GRID.SIZE.LABEL',
    scope: 'world',
    config: true,
    type: Number,
    default: 100
  });

  game.settings.register('scene-express', 'defaultInNavigation', {
    name: 'SCENE_EXPRESS.NAVIGATION.LABEL',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register('scene-express', 'defaultPermissions', {
    name: 'SCENE_EXPRESS.ACCESSIBILITY',
    scope: 'world',
    config: true,
    type: Number,
    choices: {
      0: 'SCENE_EXPRESS.ACCESSIBILITY_GM',
      2: 'SCENE_EXPRESS.ACCESSIBILITY_ALL'
    },
    default: 0
  });

  game.settings.register('scene-express', 'defaultTokenVision', {
    name: 'SCENE_EXPRESS.TOKENVISION.LABEL',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register('scene-express', 'defaultFogExploration', {
    name: 'SCENE_EXPRESS.FOG.EXPLORATION.LABEL',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });
}