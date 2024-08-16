const RE_TO_SPACE = /[_+]/g;

Hooks.once('ready', async function () {
  console.log("Scene Express | Ready");
});

const handleFile = async (file) => {
  if (!Object.values(CONST.IMAGE_FILE_EXTENSIONS).includes(file.type)) {
    ui.notifications.error(`File "${ file.name }" is not an image.`, {permanent: true});
    return {}
  }

  const futur_scene_name = file.name.split(".")[0].replace(RE_TO_SPACE, " ")
  let scene = game.scenes.find(scene => scene.name === futur_scene_name);
  if (scene) {
    ui.notifications.error(`Scene "${ futur_scene_name }" already exists.`, {permanent: true});
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
  scene.createThumbnail().then(data => {
    scene.update({thumb: data.thumb}, {diff: false});
  });
}

const handleDrop = async (event) => {
  event.preventDefault();
  event.stopPropagation();

  const savedFiles = Array.from(event.dataTransfer.files).map(
    async file => await handleFile(file)
  )
  for await (const savedFile of savedFiles) {
    await createScene(savedFile);
  }
}

Hooks.on("renderSidebarTab", async (app, html, data) => {
  // Exit early if necessary;
  console.log("Scene Express | " + app.tabName);
  if (!('scene_express_drop' in game)) {
    game.scene_express_drop = await new DragDrop({
      callbacks: {
        drop: handleDrop
      }
    });
  }
  if (app.tabName !== "scenes") return;
  /*
    const enableSceneExpress = game.settings.get("scene-express", "enableSceneExpress");
    if (!enableSceneExpress)
      return;
  */

  let footer = html.find(".directory-footer");
  const content = await renderTemplate("modules/scene-express/templates/dropzone.html", {});
  footer.before(content);
  game.scene_express_drop.bind(document.getElementById("scene-express-dropzone"));
});