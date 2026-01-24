import {registerSettings} from "./settings.mjs";

const RE_TO_SPACE = /[_+]/g;
const DROPZONE_TPL = "modules/scene-express/templates/dropzone.html";

const dragDrop = foundry.applications.ux?.DragDrop?.implementation ?? DragDrop;
const filePicker = foundry.applications.apps?.FilePicker?.implementation ?? FilePicker;
const renderTpl = foundry.applications?.handlebars?.renderTemplate ?? renderTemplate;

Hooks.once('init', async function () {
  console.log("Scene Express | Initializing");

  await registerSettings();
  const destinationFolder = game.settings.get("scene-express", "destinationFolder");

  try {
    await FilePicker.createDirectory("data", destinationFolder);
  } catch (err) {
    if (err.message.startsWith('EEXIST:')) {
      console.log("Scene Express | Scenes directory already exists in world, continuing...");
    } else {
      throw err;
    }
  }
});

Hooks.once('ready', async function () {
  game.scene_express_drop = await new dragDrop({
    dropSelector: "#scene-express-dropzone",
    callbacks: {
      drop: handleDrop
    }
  });
  if (game.release.generation >= 13) {
    Hooks.on("changeSidebarTab", onChangeSidebarTab);
  } else {
    Hooks.on("renderSidebarTab", onRenderSidebarTab);
    ui.sidebar.tabs.scenes.render();
  }
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
      game.i18n.format('SCENE_EXPRESS.SCENE_EXISTS', {sceneName: futur_scene_name}),
      {permanent: true}
    );
    return {}
  }

  const scenesLocation = game.settings.get("scene-express", "destinationFolder");

  const browser = await filePicker.browse("data", scenesLocation);
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
    const response = await filePicker.upload(
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

const createScene = async (savedFile) => {
  if (!savedFile.file) return;

  const fileExistsBehavior = game.settings.get("scene-express", "fileExistsBehavior");

  const scene_name = savedFile.file.name.split(".")[0].replace(RE_TO_SPACE, " ")
  let scene = game.scenes.find(scene => scene.name === scene_name);
  if (scene && fileExistsBehavior === 1) {
    console.log("Scene already exists and fileExistsBehavior is set to 1, skipping");
    ui.notifications.error(
      game.i18n.format('SCENE_EXPRESS.SCENE_EXISTS', {sceneName: scene_name}),
      {permanent: true}
    );
    return {}
  }

  const ctx = {
    name: scene_name,
    navigation: game.settings.get("scene-express", "defaultInNavigation"),
    background: {
      src: savedFile.path,
    },
    padding: 0,
    backgroundColor: "#000000",
    grid: {
      type: game.settings.get("scene-express", "defaultGridType"),
      size: game.settings.get("scene-express", "defaultGridSize"),
    },
    tokenVision: game.settings.get("scene-express", "defaultTokenVision"),
    fogExploration: game.settings.get("scene-express", "defaultFogExploration"),
    ownership: {
      default: game.settings.get("scene-express", "defaultPermissions"),
    }
  }

  if (scene && fileExistsBehavior >= 2) {
    console.log("Scene already exists and fileExistsBehavior is set to 2 or 3, updating");
    await scene.update(ctx);
  } else if (!scene) {
    console.log("Scene does not exist, creating");
    scene = await getDocumentClass("Scene").create({
      ...ctx,
      active: game.settings.get("scene-express", "activateImmediately"),
    });
  }
  const data = await scene?.createThumbnail({img: savedFile.path});
  await scene?.update({thumb: data.thumb, width: data.width, height: data.height});
}

const handleDrop = async (event) => {
  event.preventDefault();
  event.stopPropagation();

  const enableSceneExpress = game.settings.get("scene-express", "enableSceneExpress");
  if (!enableSceneExpress) {
    return;
  }

  const savedFiles = Array.from(event.dataTransfer.files).map(
    async file => await handleFile(file)
  );
  for await (const savedFile of savedFiles) {
    await createScene(savedFile);
  }
}

const onRenderSidebarTab = async (app, html, _) => {
  if (app.tabName !== "scenes") return;

  const enableSceneExpress = game.settings.get("scene-express", "enableSceneExpress");
  if (!enableSceneExpress) {
    return;
  }

  const content = await renderTpl(DROPZONE_TPL, {});
  const footer = html.find(".directory-footer");
  footer.before(content);

  game.scene_express_drop.bind(document.getElementById("scene-express-dropzone"));
}

const onChangeSidebarTab = async (tab, _) => {
  if (tab.tabName !== "scenes") return;

  const enableSceneExpress = game.settings.get("scene-express", "enableSceneExpress");
  if (!enableSceneExpress) {
    return;
  }

  if (tab.element.querySelector('#scene-express-dropzone')) {
    return;
  }

  const content = await renderTpl(DROPZONE_TPL, {});
  tab.element.insertAdjacentHTML('beforeend', content);

  game.scene_express_drop.bind(document.getElementById("scene-express-dropzone"));
}
