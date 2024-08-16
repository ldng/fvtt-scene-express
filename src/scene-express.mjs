const RE_TO_SPACE = /[_+]/g;

Hooks.once('init', async function () {
  console.log("Scene Express | Initializing");

  game.settings.register('scene-express', 'enableSceneExpress', {
    name: 'Enable Scene Express',
    hint: 'Control whether Scene Express is enabled or not.',
    scope: 'world',
    config: true,
    requiresReload: true,
    type: Boolean,
    default: true
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

  const futur_scene_name = file.name.split(".")[0].replace(RE_TO_SPACE, " ")
  let scene = game.scenes.find(scene => scene.name === futur_scene_name);
  if (scene) {
    ui.notifications.error(
      game.i18n.format('SCENE_EXPRESS.SCENE_EXISTS', {sceneName: futur_scene_name }),
      {permanent: true}
    );
    return {}
  }

  let response = await FilePicker.upload(
    "data",
    `worlds/${ game.world.id }/scenes`,
    file,
    {}
  );

  return {
    file: file,
    path: response.path
  };
}

const createScene = async (savedFile) => {
  if (savedFile === {}) return;

  const scene_name = savedFile.file.name.split(".")[0].replace(RE_TO_SPACE, " ");
  const scene = await getDocumentClass("Scene").create(
    {
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
    }
  );
  const data = await scene.createThumbnail();
  await scene.update({thumb: data.thumb}, {diff: false});
}

const handleDrop = async (event) => {
  event.preventDefault();
  event.stopPropagation();

  const savedFiles = Array.from(event.dataTransfer.files).map(
    async file => await handleFile(file)
  );
  for await (const savedFile of savedFiles) {
    await createScene(savedFile);
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