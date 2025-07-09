# Shroom - Room Rendering Engine for Retros

Shroom is a room rendering engine for retros.

## Documentation

The documentation can be found [here](https://jankuss.github.io/shroom/docs/).

## Official Discord Server

If you need support or you just want to talk about `shroom`, feel free to join us on our [Official Discord Server](https://discord.gg/PjeS9JHeaE).

1. bun run dump --origins --location public/habbo_assets/cst --url https://origins-gamedata.habbo.com/external_variables/1
2. wine /Users/xxx/Downloads/DirectorCastRipper_D10/DirectorCastRipper.exe /c --cli --include-names --member-types image --formats png --folders "Z:\Users\xxx\git\shroom\public\habbo_assets\cst\client_163\dump-source" --output-folder "Z:\Users\xxx\git\shroom\public\habbo_assets\cst\client_163\dump-target"
3. bun run src/tools/dump/origins-figure-to-shroom.ts