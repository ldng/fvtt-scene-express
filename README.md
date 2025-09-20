# Foundry VTT Scene Express

## Description

This Foundry VTT module allows you to quickly create a background scenes by dragging 
and dropping one or more images from your computer into Foundry VTT.

On dropping an image in the Scene Express drop zone at the bottom of the Scene tab, 
the image will be uploaded to the server and  a new scene will be created with the image 
as the background and the file name as the scene name.

The image will be uploaded in the scene directory or the current world directory.

To control the default scene creation, Scene Express provides a few selected settings :
 - activateImmediately : whether the scene activates immediately at creation
 - defaultGridType: the default type of grid to use
 - defaultGridSize: the default size of grid unit
 - defaultInNavigation: whether the scene appears in the navigation
 - defaultPermissions: whether only the GM or All player can access the scene
 - defaultTokenVision: whether the token vision is active
 - defaultFogExploration: whether the fog of exploration is active

When a file with the same name as the one being dragged and dropped already exists on the server,
the creation process's behavior can be adjusted to :
 - Stop & Notify an error
 - Create new scene with existing file
 - Overwrite existing file and create new scene with it

