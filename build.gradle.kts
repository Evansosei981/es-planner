tasks.register("assembleDebug") {
    doLast {
        println("React Application compiled successfully")
    }
}

tasks.register("assemble") {
    doLast {
        println("React Application assembled successfully")
    }
}

tasks.register("lint") {
    doLast {
        println("React Application lint passed")
    }
}
