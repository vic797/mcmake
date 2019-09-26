say $hello

$debug? tellraw @a ["",{"text":"Debug mode enabled","color":"green"}]
$!debug? tellraw @a ["",{"text":"Debug mode disabled","color":"red"}]

$blocks& execute if block ~ ~-1 ~ $_ run say Block~!

$range% say Value $_

!export "exported"

# Exported
say Exported function
$!debug? tellraw @a ["",{"text":"Debug mode disabled","color":"red"}]

!end-export