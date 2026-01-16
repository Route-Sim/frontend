# Changelog

## [1.1.0](https://github.com/Route-Sim/frontend/compare/v1.0.0...v1.1.0) (2026-01-16)


### Features

* **tests:** add Vitest setup documentation and implement MemoryStorage for test environment ([48691f5](https://github.com/Route-Sim/frontend/commit/48691f589c0e23dedefa31650aef499417f0175b))

## 1.0.0 (2026-01-04)


### Features

* added site and parking classess to sim layer ([c272edc](https://github.com/Route-Sim/frontend/commit/c272edce5d6c0a3066c5c92cdd855292faf124a8))
* **agent-inspector:** add a new debug panel for inspecting agent states; update API references and documentation accordingly ([ebcb770](https://github.com/Route-Sim/frontend/commit/ebcb77087335c1adc2257836931bb6da018da612))
* **agents-view:** refine agents rendering logic and update documentation; simplify interpolation handling and enhance truck positioning based on simulation states ([c7ce5cf](https://github.com/Route-Sim/frontend/commit/c7ce5cf7bb0df89b065aed09179a4b259bad4fc5))
* **agent:** update agent details and map parameters; change agent ID, speed, and route information; adjust map dimensions and parking parameters for improved simulation accuracy ([5f23712](https://github.com/Route-Sim/frontend/commit/5f2371225f0bf770909306e205210bca46c77846))
* broker ([#1](https://github.com/Route-Sim/frontend/issues/1)) ([dde0a9a](https://github.com/Route-Sim/frontend/commit/dde0a9ac580980fd0b7dd9160396e2062a4d61f8))
* **camera:** introduce CameraManager and InteractionManager for enhanced camera control and object interaction; add focus state management and HUD component for displaying focused object ([ebed0ed](https://github.com/Route-Sim/frontend/commit/ebed0ed7adcd85f1d1a6d6686923c12519a19c0f))
* **colors:** update color palette for improved UI aesthetics; adjust background, ground, graph, and light colors in colors.ts and HUD component styling ([fa63876](https://github.com/Route-Sim/frontend/commit/fa638764519ef32946ee7d01290d6f5f84d5e948))
* **config:** inject WebSocket URL into HTML at runtime; update Dockerfile to set VITE_WS_URL environment variable ([adb0642](https://github.com/Route-Sim/frontend/commit/adb06421bce56d733794de55015249f9606f6d7f))
* **docker:** add Dockerfile and .dockerignore for multi-stage build setup; streamline application deployment with optimized production environment ([ea7a2c9](https://github.com/Route-Sim/frontend/commit/ea7a2c92e3c23b736dc24f6d99fb41080fd1344c))
* **docker:** add Dockerfile and docker-compose.yml for multi-stage build and development profiles ([afe0811](https://github.com/Route-Sim/frontend/commit/afe081143377b7825d177810c227534727a6a714))
* **docker:** transition from Nginx to Bun HTTP server for static asset serving, update Dockerfile and docker-compose.yml, and add index.ts for SPA handling ([0bae1ef](https://github.com/Route-Sim/frontend/commit/0bae1efbc109fb7d1ef7d81c7324688bcb0e0d50))
* **docker:** update Docker Compose configuration for production and development profiles, add spine service, and enhance documentation for environment variables and volume management ([d2e5fe8](https://github.com/Route-Sim/frontend/commit/d2e5fe8b78872df02844f0f3e5c9b7150ff18016))
* **docs:** enhance API reference and glossary with detailed agent creation payloads and definitions; update Fleet Creator documentation and UI components for truck agent management ([3799ac6](https://github.com/Route-Sim/frontend/commit/3799ac6ebdf334a98a0db6a08776edc0e4a22996))
* **docs:** update glossary and module summaries; add new engine and view components documentation ([b9467a5](https://github.com/Route-Sim/frontend/commit/b9467a53d0111ad61e314239448c4d9e56a7933a))
* **engine:** add delivery site and parking modules; update scene manager to include new objects and enhance documentation for improved clarity ([244a47f](https://github.com/Route-Sim/frontend/commit/244a47f903c2da03320fe79e312e70676f7140e5))
* **engine:** implement site creation module with detailed geometry and materials for warehouse and loading docks; update graph view to utilize new site function ([ad8f530](https://github.com/Route-Sim/frontend/commit/ad8f530850203a629c003e815193fd49229ab253))
* **favicon:** add favicon to the application; update playback controller tests to include speed parameter in simulation commands ([a102da2](https://github.com/Route-Sim/frontend/commit/a102da297b6f57b973f3b7eec9c61673d7e06702))
* **fleet-creator:** enhance agent event handling by adding subscription for agent listing; refactor unsubscribe logic for clarity ([fa9b63d](https://github.com/Route-Sim/frontend/commit/fa9b63d46c3f7218e492173796bfb6e01f245b76))
* **gas-station:** implement gas station entity and rendering logic; add color definitions, create gas station model, and integrate into simulation with appropriate properties and UI support ([3b5b45a](https://github.com/Route-Sim/frontend/commit/3b5b45ad7191d3b3a2b54f782508cf54170b7803))
* **graph:** enhance road rendering by introducing road classes and shared geometry; refactor Graph View to utilize new road mesh creation logic and update scaling for improved visual representation ([5d9d2a1](https://github.com/Route-Sim/frontend/commit/5d9d2a1d7281744d9ef2ca06d6832785600527be))
* **graph:** introduce Graph Transform module for normalization of simulation graph coordinates; update Graph View to utilize new transformation logic ([2ed1fcf](https://github.com/Route-Sim/frontend/commit/2ed1fcfee8e799928f163bb807fd55bae8bd94b5))
* **graph:** replace graph-primitives with dedicated node and road modules; update documentation and references across engine components for improved clarity and structure ([17698b9](https://github.com/Route-Sim/frontend/commit/17698b936649d6747ded8bc34f043734a2e187ff))
* **hud:** introduce Focus Inspector and related hooks for enhanced object inspection; refactor HUD structure to utilize SimStore context and remove deprecated components ([3d0289f](https://github.com/Route-Sim/frontend/commit/3d0289fa0feea6ca2438622c89efe7ddcdcc569a))
* **HUD:** introduce Map Creator, Fleet Creator, and Start Simulation panels with playback state management ([e70e96b](https://github.com/Route-Sim/frontend/commit/e70e96b80ee10c23c8ba3e22e252f8a559b408cf))
* initial commit ([db02cfe](https://github.com/Route-Sim/frontend/commit/db02cfe715ef1714391b70f1d87a9124e07501c2))
* initial networking layer implementation ([80fc29d](https://github.com/Route-Sim/frontend/commit/80fc29d53ff3d2e425f2e30d5e4868c39f5f25ca))
* **inspector:** enhance agent and building inspectors; add gas station inspector, improve UI for displaying agent status, and update building properties for better simulation insights ([9479062](https://github.com/Route-Sim/frontend/commit/9479062386f4fba6e69cccd0b4c698551e5dc2aa))
* **inspector:** refactor and introduce specialized inspectors for simulation entities; replace monolithic agent inspector with dedicated components for agents, roads, nodes, buildings, and trees; update Focus Inspector to utilize new structure ([37a868f](https://github.com/Route-Sim/frontend/commit/37a868f0e402a6224bb5873183df8d611da12046))
* **map-creator, api-reference:** implement map export and import functionality; update API schemas and documentation to support new features, including file handling and user interface enhancements for map management ([a00b4cf](https://github.com/Route-Sim/frontend/commit/a00b4cfbc1a9954401759ece8e2f62514ba2af0e))
* **map-creator:** add gas station parameters and properties to map creator; include urban and rural gas station counts, capacity, and cost factor ranges in the configuration and UI ([7ce3ea5](https://github.com/Route-Sim/frontend/commit/7ce3ea57e0edb643187888602aa262fe072a3032))
* **map-creator:** add urban and rural parking parameters to map creation; update state management to handle new data fields ([cf06681](https://github.com/Route-Sim/frontend/commit/cf066811309c3aded107ffd68c24f9edc8bedaf7))
* **map-graph, schema:** add support for gas stations in map data; update MapGraph component to display generated gas stations and enhance API schema to include gas station count ([75ddc09](https://github.com/Route-Sim/frontend/commit/75ddc093b5683bb6007a68251558ecd947878ee7))
* **map:** add enums for building kinds and road classes; enhance entity definitions with coordinates and lengths; implement map creation event handling in the simulation store ([c39f491](https://github.com/Route-Sim/frontend/commit/c39f4910adc1a7cce0b24aec52e990eb12b69216))
* **map:** enhance map creation parameters by adding urban and rural site metrics, and activity rate ranges in the Map Creator UI; update WebSocket request schema and Docker Compose command for development ([482850f](https://github.com/Route-Sim/frontend/commit/482850f312a54bb55076e380054061ce506fee57))
* **map:** implement 2D graph visualization for generated maps in Map Creator using react-konva; update API documentation and schemas for map.created signal ([2912a3b](https://github.com/Route-Sim/frontend/commit/2912a3b79b57d6fb45b94569e3befd1626c40c47))
* **net-adapter:** introduce net adapter module for mapping network signals to SimEvents; enhance entity definitions and update schema for improved data handling ([ac802ed](https://github.com/Route-Sim/frontend/commit/ac802eda6ac2cba25a4e32aecd106b8f4efe2020))
* **object-picker:** add Object Picker component for enhanced object selection in simulation; implement searchable interface for trucks and buildings, improving navigation and focus capabilities ([4c9b9cc](https://github.com/Route-Sim/frontend/commit/4c9b9cc0abb949b641f3f585539cc6c6143a7ecd))
* **playback:** update playback command and state to include speed; enhance play controls and simulation start logic for improved user experience ([322d51d](https://github.com/Route-Sim/frontend/commit/322d51d03f6fbdc28efbb9874c57168982808d73))
* **protocol:** add 'simulation.pause' action and corresponding signal, update documentation and schemas ([f63ddd4](https://github.com/Route-Sim/frontend/commit/f63ddd49d5edd70154dbdbb7550993d8c8ad8f7f))
* **protocol:** add tick.start and tick.end signals to manage simulation ticks; update API documentation and schemas; introduce wireNetToSim adapter for signal handling ([f069691](https://github.com/Route-Sim/frontend/commit/f0696911837a34b4f2dbb98f075078dd2323c957))
* **sim:** add simulation configuration handling; implement event forwarding for simulation start and update; enhance state management with speed and tick rate adjustments ([0df822f](https://github.com/Route-Sim/frontend/commit/0df822f71643aad7b908fa6e9a6f9086ce592843))
* **sim:** enhance truck and agent data handling; add current node, edge, and progress properties to truck interface and update mapping logic in net adapter ([555b468](https://github.com/Route-Sim/frontend/commit/555b468166530e887780628e4e7af30248c3b7cf))
* **sim:** implement movement system for trucks; enhance event handling and routing logic in net adapter and store ([d2ed4d3](https://github.com/Route-Sim/frontend/commit/d2ed4d325b96edd2655215a6bc99960a6ca391f3))
* **sim:** integrate building data handling for parking and site types in simulation events and state management ([f213687](https://github.com/Route-Sim/frontend/commit/f213687261f4bd0f7f0641d8e1bb52f2474e22d7))
* **simulation-controls, state-management:** introduce simulation controls for playback management, including state export/import functionality; update API reference and HUD components for enhanced user experience ([a8d3287](https://github.com/Route-Sim/frontend/commit/a8d3287beb883ddcc743cff0cda28a6000ba351f))
* **simulation:** introduce simulation clock component and enhance tick signals with time and day; update API reference and glossary for clarity ([0a5a96e](https://github.com/Route-Sim/frontend/commit/0a5a96e3206f946679b80dd0bf21aaf95a16d009))
* **tests:** add comprehensive tests for engine objects; implement unit tests for ground, parking lot, trees, gas stations, intersections, and road helpers, ensuring robust validation of object creation and properties ([66316b1](https://github.com/Route-Sim/frontend/commit/66316b13c7390362ef5d812c1023e7690d4c3302))
* **tests:** add comprehensive unit tests for simulation components including selectors, adapters, and store; enhance coverage for movement and interpolation systems ([0499d03](https://github.com/Route-Sim/frontend/commit/0499d03fce60c58e98b5447398ad7dad55dc6ef7))
* **tests:** add unit tests for HUD components and hooks; implement type validation and visibility management tests ([411d8d4](https://github.com/Route-Sim/frontend/commit/411d8d4d1cfd5a83c92e6ee63c9fcc4edef40eb2))
* **tests:** add unit tests for WebSocket client, event bus, and protocol handling; implement coverage reporting and configure Vitest ([89918c5](https://github.com/Route-Sim/frontend/commit/89918c57858b1e9a5ce7437edf81a0ed3f0a60d7))
* **tests:** enhance testing suite for HUD components; add new tests for camera help, fleet creator, map creator, and net events, ensuring comprehensive coverage of simulation interactions and state management ([8f9b494](https://github.com/Route-Sim/frontend/commit/8f9b4949485a41198874135e208ec3ae2f3d6ab4))
* **tests:** expand test coverage for HUD visibility and playback state; add new test cases for state management and error handling ([30f1fce](https://github.com/Route-Sim/frontend/commit/30f1fce94e0f01cca4599e5a4c8097efa258a311))
* **tree:** introduce procedural tree generation module and update documentation; enhance graph view to include buildings and improve rendering logic for parking and delivery sites ([e447f79](https://github.com/Route-Sim/frontend/commit/e447f794b69aa640bc37d8bbf2b079aa8d5a35b6))
* **yaak:** update websocket request configurations and agent signal mappings; add new websocket requests for agent listing and description, and adjust existing agent creation and deletion requests; enhance protocol schemas for agent actions ([28e29a9](https://github.com/Route-Sim/frontend/commit/28e29a904d2a5f0547e7552275b9edd2ebcc8e1e))


### Bug Fixes

* **fleet-creator, map-creator:** update default fuel and ring road probability values to enhance simulation realism and balance ([4d227e0](https://github.com/Route-Sim/frontend/commit/4d227e0501da09a680a1cde36ec6dedd03544d06))
* **map-creator:** update last_updated date and enhance map.created event handling to defensively merge incoming data with existing parameters, ensuring stability during schema evolution ([abf806a](https://github.com/Route-Sim/frontend/commit/abf806afdf8cf5b738431806f1790c553c276121))
* **map:** correct map dimensions in WebSocket request and Map Creator defaults from 10000 to 1000 ([6d95cad](https://github.com/Route-Sim/frontend/commit/6d95cadae704f7adc8433a63e5f803835b6aff83))
* **orbit-move-controls:** update minY parameter and movement speed; enhance floor clamping logic for improved camera behavior ([1e4c103](https://github.com/Route-Sim/frontend/commit/1e4c103f74d12b39d6cab6acfb5422b9c17e205b))
* **select:** increase z-index for select content to ensure proper visibility over other UI elements ([1830866](https://github.com/Route-Sim/frontend/commit/18308669fb3a6f07b22be6c840119b1b0b9b4f81))
* **tree-inspector:** update description of decorative vegetation object for clarity ([6ff1db1](https://github.com/Route-Sim/frontend/commit/6ff1db1a1dddb06fa0380515e6352a0e1da1dc8f))
