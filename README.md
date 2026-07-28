# Ocean Art

This project is an abstract, data-driven representation of the ocean as a living and changing ecosystem. Using historical datasets from 1970 to 2020, the artwork translates fish populations, plankton abundance, sea-surface temperature, plastic pollution, and fishing activity into movement, density, color, visibility, and force.

It is not intended as a realistic simulation, but as a symbolic visual system in which living organisms and environmental influences interact over time. The image develops mostly autonomously, with fish leaving trails and creating constantly changing compositions.

Viewers can intervene through touch, but their influence remains small compared to larger forces such as pollution, rising temperature, and fishing pressure. The central idea is that life creates its own artwork, while the environment around it is gradually transformed by human and natural influences.

Demo-Video:

[![Demo-Video ansehen](https://img.youtube.com/vi/QJjTTirtgCU/maxresdefault.jpg)](https://www.youtube.com/watch?v=QJjTTirtgCU)

[GitHub Repository](https://github.com/luxas-lxo/Prototype.git)

## Ideation and Related Works

My project began with a broad exploration of nature-inspired interactive artworks and data-driven digital art. In the early stages, I considered creating an interactive forest in which trees, plants, and animals would react to environmental datasets such as CO₂ emissions, rising temperatures, or biodiversity loss.

The main goal was to communicate environmental change through generative animation and interaction rather than through traditional charts or static visualizations.

During the ideation process, I explored several directions:

- **Interactive Digital Forest** – A living forest that changes in response to real environmental data.
- **Nature Observing Humanity** – A reversal of perspective in which nature reads and interprets human-generated data instead of humans observing and measuring nature.
- **Data as Organic Structures** – Inspired by artists such as Ouchhh and Refik Anadol, I became interested in transforming datasets into abstract, flowing forms rather than displaying them directly.
- **Progressive Revelation Through Interaction** – An artwork that would not reveal its full structure immediately, but would slowly become visible through touch and movement.
- **Autonomous Generative Systems** – A system in which the artist defines rules and relationships, while the final composition develops independently through movement, randomness, and interaction.

As the concept evolved, I moved away from the idea of a literal interactive forest. The forest offered many possibilities, but it also risked becoming too illustrative and visually familiar.

I became more interested in the ocean because it provides a more open, fluid, and mysterious visual space. It allowed me to combine movement, depth, particles, currents, and environmental forces in a more abstract way. The available ocean-related datasets also appeared more suitable for building a continuous visual development across several decades.

The final direction became an evolving ocean ecosystem controlled by multiple datasets. Instead of presenting each dataset separately, I wanted them to exist together inside one visual system and interact with one another.

This approach was influenced by data-driven artworks that use information as material, but I wanted the data to affect behavior rather than simply produce a visual surface. The values influence how organisms move, how densely they appear, how visible they are, and how strongly external forces affect the environment.

## Concept

The final project is an interactive, data-driven artwork representing an abstract ocean ecosystem. Fish schools, plankton populations, sea-surface temperature, plastic pollution, fishing pressure, and direct human interaction all influence the behavior and appearance of the system.

Each dataset controls different visual properties, including movement, density, color, visibility, atmosphere, and force.

The artwork uses historical data from 1970 to 2020. Because of this, the image does not represent a single fixed moment. It develops over time and creates a visual narrative across fifty years.

As the timeline progresses, changes in the datasets gradually alter the composition. Fish populations increase or decrease, plankton density changes, the background atmosphere shifts with temperature, pollution becomes more present, and fishing pressure appears as moving currents that affect the fish.

The data is not displayed through graphs or complete numerical datasets. Instead, it is translated into visual and behavioral changes. This means that the viewer experiences the data indirectly.

A decrease in population becomes an emptier space. An increase in temperature becomes a change in background color and atmosphere. Fishing activity becomes a physical force moving through the scene. Pollution reduces color and creates areas in which the ecosystem appears visually weakened.

The work is not intended to be a scientific simulation. The relationships between the individual systems are symbolic and interpretative. The goal is not to reproduce the ocean with complete biological accuracy, but to communicate the idea that environmental systems are interconnected and that changes in one area can influence the entire atmosphere of a habitat.

The fish and plankton represent living systems that continuously adapt to their surroundings. Their movement is partly controlled by data, but also by autonomous behavior, randomness, interaction, and an aging mechanism that gradually changes the visibility of individual fish.

This creates compositions that are never exactly repeated. The artwork therefore exists between control and unpredictability: I define the rules of the system, but I do not completely determine the image that appears.

One of the central interpretations of the project is that **life creates its own artwork**. The fish leave trails behind them, groups form and separate, particles drift through the scene, and the interaction between all elements produces constantly changing visual structures.

The final composition is not drawn directly by an artist. It emerges from the behavior of the organisms and the forces acting upon them.

At the same time, the artwork reflects different scales of influence. The viewer can interact with the scene through touch, creating a small local disturbance that pushes nearby organisms away. However, this intervention is temporary and limited.

Larger forces such as fishing, pollution, and increasing temperature affect a much greater part of the ecosystem. This contrast suggests that individual actions can create visible changes, but larger environmental and economic systems often have a stronger and more lasting impact.

The direct touch interaction can also be interpreted as a human desire to control or influence nature. The viewer can intervene, but the ecosystem continues to move according to its own rules and historical data. The system cannot be fully controlled through a single gesture, emphasizing the autonomy and complexity of natural environments.

The changing visual atmosphere is also important. At the beginning, the scene can appear more open, mysterious, and alive. Over time, the increasing presence of external pressures changes the mood of the artwork.

The image may remain visually attractive, but its beauty becomes more ambiguous. This contrast is intentional: environmental degradation does not always appear as a sudden or dramatic collapse. It can happen gradually while the system still seems active and aesthetically fascinating.

The project therefore explores the tension between beauty and damage. The artwork remains generative and visually engaging, even while the conditions within the represented ecosystem become more difficult.

Ultimately, the project presents the ocean as a connected, living, and constantly changing system. Rather than offering a direct solution or a purely negative image, the artwork creates a space for observation and reflection on how closely life, data, human influence, and environmental change are connected.

## Technical Realization

The project was developed as a browser-based interactive artwork using **p5.js**, a JavaScript library for creative coding and generative graphics. The main development environment was **Visual Studio Code**, while the project was tested locally in a web browser using the **Live Server** extension.

The visual system consists of several connected particle-based simulations. Fish schools and plankton are represented by large groups of particles whose movement, density, size, color, and visibility are influenced by environmental datasets.

Each major system, including fish, plankton, temperature, pollution, and fishing pressure, is implemented as its own JavaScript class. These classes contain their own methods for loading or receiving data, updating movement and behavior, controlling visual properties, and rendering their elements.

Instead of continuously creating and deleting particles, the system uses fixed particle pools and activates or deactivates individual elements depending on the current data values. This approach improves performance and allows population changes to appear gradually.

A synchronized year counter controls the complete project timeline. For every year, the corresponding values are read from preprocessed data tables and passed to the relevant visual systems at the same time. This allows all parts of the artwork to develop together as one connected environment.

The graphical appearance is created through a combination of standard p5.js drawing methods, **WebGL shaders**, and multiple offscreen graphics layers. These techniques are used primarily for rendering and post-processing rather than for the underlying data logic.

Separate layers are used for fish, movement trails, pollution masks, touch effects, and background processing. These layers are combined during the final rendering stage. Shader-based post-processing creates atmospheric color changes, glow, distortion, and the cloud-like representation of sea-surface temperature.

The project also includes direct mouse and touch interaction. When the viewer touches or drags across the screen, temporary force points are created. Nearby fish react by moving away, while a shader-based glow makes the interaction visible.

### Environmental Data Sources

The project is based on several real environmental datasets:

- [**Living Planet Index / Living Planet Report 2024**](https://www.livingplanetindex.org/data_portal) – Atlantic cod population and biomass development.
- [**Continuous Plankton Recorder, provided through BCO-DMO**](https://www.bco-dmo.org/dataset/765141) – Annual zooplankton abundance.
- [**NOAA ERSSTv6**](https://psl.noaa.gov/data/gridded/data.noaa.ersst.v6.html) – Annual mean sea-surface temperature in the North Atlantic.
- [**OECD Plastic Leakage**](https://data-explorer.oecd.org/vis?fs[0]=Topic,1%7CEnvironment%20and%20climate%20change%23ENV%23%7CPlastics%23ENV_PLS%23&pg=0&fc=Topic&bp=true&snb=11&df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_PL_2019%40DF_PL_2019&df[ag]=OECD.ENV.EEI&df[vs]=1.0&isAvailabilityDisabled=false&page=0) – Estimates of accumulated plastic pollution in the ocean.
- [**ICES Historical Nominal Catches and Official Nominal Catches**](https://www.ices.dk/data/dataset-collections/Pages/Fish-catch-and-stock-assessment.aspx) – Total fishing activity and Atlantic cod catch volumes.

### Data Preprocessing

The datasets cover different time periods and use different units and structures. Before they were integrated into the artwork, they were cleaned and preprocessed.

Relevant regions, species, and variables were selected, missing or inconsistent values were handled, and the data was converted into simplified yearly CSV files. Some values were normalized or interpolated in advance so that the visual systems could use them more efficiently.

No entirely new environmental data was invented during this process. Interpolation was only used to create transitions between existing values or to bridge missing points where appropriate. The resulting values were still based on the original datasets.

This preprocessing reduced the amount of work that had to be performed in real time. Instead of filtering large raw datasets or calculating complex statistical transformations while the artwork was running, the sketch only had to load compact files and map the prepared values to visual parameters.

This helped reduce computational cost and improved the stability of the animation.

### Data Mapping and Timeline

The system progresses through a timeline from 1970 to 2020. For each year, the corresponding values are passed synchronously to the different visual systems.

- Fish population data controls the number of active fish.
- Plankton data influences particle density.
- Temperature data changes the overall atmosphere and background color.
- Plastic pollution creates areas of reduced color.
- Fishing data generates directional forces that push fish through the environment.

Smooth interpolation is used between values so that the artwork changes continuously instead of jumping suddenly from one year to the next. This makes the historical development easier to experience as one connected visual process.

### Interaction and Hardware

User interaction is implemented through mouse and touch events. When the viewer touches or drags across the screen, a temporary force is created around the interaction point.

Nearby fish particles move away, while a shader-based glow visualizes the gesture. The interaction is intentionally limited, so the viewer can influence the local system without gaining complete control over it.

The project was designed for a fullscreen presentation on a computer or touchscreen display. No additional sensors or external hardware were required.

The hardware setup consisted of a standard laptop or desktop computer, a display, and either a mouse or touchscreen for interaction. Because the project uses multiple shaders, large particle systems, trails, and several graphics layers, a computer with a reasonably capable graphics processor is beneficial for stable performance.

### Performance Optimization

Performance was an important part of the implementation because the artwork contains many particles, trails, transparent layers, masks, and shader effects.

Several optimizations were therefore used:

- Reduced pixel density
- Reusable particle pools
- Limited particle counts
- Less frequent updates for selected effects
- Preprocessed datasets
- Separate rendering layers
- Fixed-size shader particle arrays
- Simplified data lookup during runtime

These measures helped maintain a stable frame rate while preserving the visual complexity of the artwork.

## Summary and Further Work

### What Worked Well

Several aspects of the project worked well. The combination of multiple environmental datasets into one visual ecosystem created a coherent and evolving artwork instead of a collection of separate data visualizations.

The fish, plankton, temperature, pollution, and fishing-pressure systems interact visually and help communicate the idea that environmental processes are interconnected.

The autonomous movement of the particles was especially successful. Since the fish and plankton are influenced by data, noise, forces, and random variation, the composition changes continuously and never looks exactly the same.

The fish trails also support the central interpretation that living organisms create their own visual structures within the artwork.

The translation of numerical data into visual properties worked well overall. Population changes affect density, temperature changes the atmosphere, pollution reduces color, and fishing pressure becomes a physical force.

This makes the data perceptible without relying on diagrams or displaying complete datasets. The gradual timeline from 1970 to 2020 also creates a clear development over time.

The touch interaction was another successful element. It allows viewers to influence the artwork directly and makes the system feel responsive.

At the same time, the relatively weak impact of a single touch supports the concept that individual human actions have less influence than large environmental and industrial forces.

### What Could Be Improved

Some visual differences between individual years and datasets are too subtle. Without additional context, viewers may recognize that the image is changing but may not understand which dataset is responsible for a specific change. In some cases, they may not notice the change at all.

These changes could be made more visible through stronger visual contrasts, or more pronounced transitions. However, increasing the visual complexity would also create additional performance costs, so a balance between clarity and technical stability would be necessary.

The human-made influences could also be more visually prominent. Pollution and fishing pressure are present, but they could create stronger structural changes in the composition.

For example, fishing pressure could divide schools, redirect their movement more dramatically, or create temporary empty areas. Pollution could affect not only color but also movement, visibility, aging, or the survival time of particles.

The composition could also be made denser and more varied. My original concept included more particle groups, greater visual chaos, stronger contrast between natural and human-made systems, and more abstract visualizations.

One example was a coral system based on generative Diffusion-Limited Aggregation. The system was already partly developed, but it could not be included in the final artwork because its calculations created too much additional performance load.

These ideas had to be reduced because of time constraints and technical limitations. The current version is therefore more minimal and controlled than initially planned.

### Further Development

With more development time, I would improve the performance architecture first. More calculations could be moved into shaders, spatial data structures could reduce the cost of particle interactions, or the project could be restructured using more efficient p5.js techniques or a different graphics framework.

This would allow more organisms, larger swarms, longer trails, more detailed pollution effects, and additional systems such as corals while maintaining a stable frame rate.

I would also develop the visual language of each dataset further. Different fish populations could have individual movement patterns, colors, sizes, or spatial behaviors. More fish species and larger datasets could be included to create a more diverse ecosystem.

Additional plankton species could react differently to environmental changes. In the current version, the plankton mainly corresponds to its own dataset. A future version could include stronger interactions between plankton, temperature, fish populations, and pollution.

Pollution could spread through simulated currents and affect fish even after they leave a polluted area. For example, fish could temporarily retain reduced color or altered movement after passing through a pollution patch.

Fishing activity could be represented through larger directional structures, stronger disruptions, or temporary separations within fish schools.

The interaction could also become more meaningful. Instead of only pushing particles away, different gestures could produce different responses.

A short touch could create a local disturbance, while a longer interaction could reveal data, change the current year, or temporarily expose the connections between the individual systems. Multi-touch input could represent collective influence and create a stronger effect than a single touch.

Another improvement would be the use of sound. A generative soundscape could react to the same datasets as the visual system. Population density, temperature, pollution, and fishing pressure could influence rhythm, volume, texture, or pitch.

This would make the historical development more immersive and could help communicate changes that are visually subtle.

The interface could also be refined. A clearer start screen, improved timeline controls, and an optional data display could help viewers understand how the artwork develops without reducing its abstract character.

Finally, I would conduct more user testing. Observing how viewers interpret the artwork would help determine whether its environmental message is understandable without explanation.

Based on this feedback, I could adjust the balance between abstraction and clarity. The goal would be to preserve the mysterious and generative character of the artwork while making its connection to environmental data and human influence more accessible.

In the end, this is an artwork about life and changing systems. Even some of its unfinished or imperfect elements reflect that idea. The work tells the story of an environment moving through time and leaving behind its own visual history.