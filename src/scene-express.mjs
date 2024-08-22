const RE_TO_SPACE = /[_+]/g;

Hooks.once('init', async function () {
  console.log("Scene Express | Initializing");

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

  game.settings.register('scene-express', 'activate', {
    name: 'SCENE_EXPRESS.IMMEDIATELY_ACTIVE',
    hint: 'SCENE_EXPRESS.IMMEDIATELY_ACTIVE_HINT',
    scope: 'world',
    config: true,
    type: Boolean,
    default: 'false'
  });
});

Hooks.once('ready', async function () {
  game.scene_express_drop = await new DragDrop({
    callbacks: {
      drop: handleDrop
    }
  });
  Hooks.on("renderSidebarTab", onRenderSidebarTab);
  ui.sidebar.tabs.scenes.render();
  console.log("Scene Express | Ready");
});

const handleFile = async (file) => {
  if (!Object.values(CONST.IMAGE_FILE_EXTENSIONS).includes(file.type)) {
    ui.notifications.error(
      game.i18n.format('SCENE_EXPRESS.UNHANDLED_IMAGE', {fileName: file.name}),
      {permanent: true}
    );
    return {}
  }

  const fileExistsBehavior = game.settings.get("scene-express", "fileExistsBehavior");

  const futur_scene_name = file.name.split(".")[0].replace(RE_TO_SPACE, " ")
  let scene = game.scenes.find(scene => scene.name === futur_scene_name);
  if (scene && fileExistsBehavior === 1) {
    ui.notifications.error(
      game.i18n.format('SCENE_EXPRESS.SCENE_EXISTS', {sceneName: futur_scene_name }),
      {permanent: true}
    );
    return {}
  }

  const scenesLocation = `worlds/${ game.world.id }/scenes/`;

  const browser = await FilePicker.browse("data", scenesLocation);
  if (browser.files.includes(scenesLocation + file.name) && fileExistsBehavior === 1) {
    console.log("File already exists and fileExistsBehavior is set to 3, skipping");
    ui.notifications.error(
      game.i18n.format('SCENE_EXPRESS.FILE_EXISTS', {fileName: file.name}),
      {permanent: true}
    );
    return {}
  } else if (browser.files.includes(scenesLocation + file.name) && fileExistsBehavior === 2) {
    console.log("File already exists, selecting existing file");
    return {
      file: file,
      path: scenesLocation + file.name
    };
  } else if (!browser.files.includes(scenesLocation + file.name) || fileExistsBehavior === 3) {
    console.log("File does not exist or fileExistsBehavior is set to 3, uploading");
    const response = await FilePicker.upload(
      "data",
      scenesLocation,
      file
    );
    return {
      file: file,
      path: response.path
    };
  } else {
    console.log("Unhandled case");
    return {}
  }
}

const createScene = async (savedFile, active = false) => {
  if (savedFile === {}) return;

  const fileExistsBehavior = game.settings.get("scene-express", "fileExistsBehavior");

  const scene_name = savedFile.file.name.split(".")[0].replace(RE_TO_SPACE, " ")
  let scene = game.scenes.find(scene => scene.name === scene_name);
  if (scene && fileExistsBehavior === 1) {
    console.log("Scene already exists and fileExistsBehavior is set to 1, skipping");
    ui.notifications.error(
      game.i18n.format('SCENE_EXPRESS.SCENE_EXISTS', {sceneName: scene_name }),
      {permanent: true}
    );
    return {}
  }

  if(scene && fileExistsBehavior >= 2) {
    console.log("Scene already exists and fileExistsBehavior is set to 2 or 3, updating");
    await scene.update(    {
      name: scene_name,
      active: false,
      navigation: true,
      background: {
        "src": savedFile.path,
      },
      padding: 0,
      backgroundColor: "#000000",
      grid: {type: 0},
      tokenVision: true,
      fogExploration: false,
    });
  } else if (!scene) {
    console.log("Scene does not exist, creating");
    const file_name = savedFile.file.name.split(".")[0];
    scene = await getDocumentClass("Scene").create(
      {
        name: scene_name,
        active: active,
        navigation: true,
        background: {
          "src": savedFile.path,
        },
        padding: 0,
        backgroundColor: "#000000",
        grid: {type: 0},
        tokenVision: true,
        fogExploration: false,
      }
    );
  }
  const data = await scene.createThumbnail();
  await scene.update({thumb: data.thumb}, {diff: false});
}

const handleDrop = async (event) => {
  event.preventDefault();
  event.stopPropagation();

  const active = event.dataTransfer.files.length === 1 &&
    game.settings.get("scene-express", "activate");

  const savedFiles = Array.from(event.dataTransfer.files).map(
    async file => await handleFile(file)
  );
  for await (const savedFile of savedFiles) {
    await createScene(savedFile, active);
  }
}

const onRenderSidebarTab = async (app, html, _) => {
  // Exit early if necessary;
  if (app.tabName !== "scenes") return;

  const enableSceneExpress = game.settings.get("scene-express", "enableSceneExpress");
  if (!enableSceneExpress) {
    return;
  }

  let footer = html.find(".directory-footer");
  const content = await renderTemplate("modules/scene-express/templates/dropzone.html", {});
  footer.before(content);
  game.scene_express_drop.bind(document.getElementById("scene-express-dropzone"));
}