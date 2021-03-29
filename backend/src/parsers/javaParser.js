const
  corUtil = require("../corUtils"),
  parser = require("java-parser");

const javaParser = {

  checkParticularChildren(throwIfError, content, functionName, childName) {
    if (!content) {
      let errorText = `[${functionName}] object provided is UNDEFINED or NULL`;
      if (throwIfError) {
        corUtil.log(errorText);
        throw new Error(errorText);
      } else {
        return null;
      }
    }
    if (!content.children || !content.children[childName] || !Array.isArray(content.children[childName])) {
      let errorText = `[${functionName}] child ${childName} not found or not an array`;
      if (throwIfError) {
        console.log(errorText);
        throw new Error(errorText);
      } else {
        return null;
      }
    }
    if (content.children[childName].length === 0) {
      let errorText = `[${functionName}] child ${childName} is empty`;
      if (throwIfError) {
        console.log(errorText);
        throw new Error(errorText);
      } else {
        return null;
      }
    }
    let result = content.children[childName];

    if (arguments.length > 4) {
      // recursive calls to evaluate the rest of the arguments
      let args = Array.from(arguments);
      let restOfArgs = args.slice(4);
      result = this.checkParticularChildren(throwIfError, result[0], functionName, ...restOfArgs);
    }
    return result;
  },

  checkParticularChild(throwIfError, content, functionName, childName) {
    // let children = this.checkParticularChildren(throwIfError, content, functionName, childName);
    let children = this.checkParticularChildren(...arguments);
    return children ? children[0] : null;
  },

  getParticularChildValue(throwIfError, content, functionName, childName) {
    // let children = this.checkParticularChildren(throwIfError, content, functionName, childName);
    let children = this.checkParticularChildren(...arguments);
    return children ? this.extractExpressionValue(children[0]) : null;
  },

  parseJavaContent(fileContent, fileInfo) {
    let content;
    try {
      content = parser.parse(fileContent);
      content.fileName = fileInfo.relative;
      if (!content) {
        throw Error(`Java file parsing failed ${fileInfo.related}`);
      }
    } catch (e) {
      corUtil.error(`Failed to parse java file ${fileInfo.related}`, e);
      return {
        success: false,
        errors: [ `Failed to parse java file ${fileInfo.related}`]
      };
    }
    let info = this.extractClassesInfo(content, fileContent);

    let javaOwnershipInfo = this.extractOwnershipInfo(info, content);

    return { success: true, content, info, javaOwnershipInfo };
  },

  getFirstClassDeclaration(content) {
    let ordinaryCompilationUnit = this.checkParticularChild(true, content, "getFirstClassDeclaration", "ordinaryCompilationUnit");
    let typeDeclaration = this.checkParticularChild(true, ordinaryCompilationUnit, "getFirstClassDeclaration", "typeDeclaration");
    let classDeclaration = this.checkParticularChild(true, typeDeclaration, "getFirstClassDeclaration", "classDeclaration");
    return classDeclaration;
  },

  extractAnnotationsInfo(typeDeclaration, modifierNodeName) {
    let modifiers = this.checkParticularChildren(false, typeDeclaration, "extractClassAnnotationsInfo", modifierNodeName);
    if (!modifiers) {
      return null;
    }
    let annotationsInfo = [];
    for( let i=0; i < modifiers.length; i++) {
      let annotations = this.checkParticularChildren(false, modifiers[i], "extractClassAnnotationsInfo", "annotation");
      if (annotations) {
        for (let annIndex=0; annIndex < annotations.length; annIndex++) {
          let annotation = annotations[annIndex];
          let annotationInfo = this.extractAnnotationInfo(annotation);
          annotationsInfo.push(annotationInfo);
        }
      }
    }

    return annotationsInfo;
  },

  extractClassInfo(firstClassDeclaration, typeDeclaration) {
    let classInfo = {};
    classInfo.javadoc = this.getClassJavadoc(typeDeclaration, classInfo);

    classInfo.annotations = this.extractAnnotationsInfo(firstClassDeclaration, "classModifier");
    let classDeclaration = this.checkParticularChild(true, firstClassDeclaration, "extractClassInfo", "normalClassDeclaration");

    classInfo.classType = this.getParticularChildValue(false, classDeclaration, "extractClassInfo", "Class");
    classInfo.superclass = this.getParticularChildValue(false, classDeclaration, "extractClassInfo", "superclass", "classType", "Identifier");
    classInfo.className = this.getIdentifier(classDeclaration, "typeIdentifier");

    let classBodyWrapper = this.checkParticularChildren(true, classDeclaration, "extractClassInfo", "classBody");
    let classBody;
    if (classBodyWrapper && Array.isArray(classBodyWrapper)) {
      classBody = this.checkParticularChildren(false, classBodyWrapper[0], "extractClassInfo", "classBodyDeclaration");
    }

    classInfo.other = [];
    classInfo.fields = [];
    classInfo.methods = [];

    if (classBody) {
      // it might be absent for empty classes
      for (let memberIndex=0; memberIndex < classBody.length; memberIndex++) {
        let memberDeclaration = classBody[memberIndex];
        let memberInfo = this.extractClassBodyInfo(classInfo, memberDeclaration);
        if (!memberInfo) {
          continue;
        }
        if (memberInfo.kind === 'field') {
          classInfo.fields.push(memberInfo);
        } else {
          if (memberInfo.kind === 'method') {
            classInfo.methods.push(memberInfo);
          } else {
            classInfo.other.push(memberInfo);
          }
        }
      }
    }


    return classInfo;
  },

  extractClassesInfo(content, textContent) {
    let classesInfo = {};
    classesInfo.classes = [];

    let ordinaryCompilationUnit = this.checkParticularChild(true, content, "getFirstClassDeclaration", "ordinaryCompilationUnit");
    let typeDeclaration = this.checkParticularChild(true, ordinaryCompilationUnit, "getFirstClassDeclaration", "typeDeclaration");
    let firstClassDeclaration = this.checkParticularChild(false, typeDeclaration, "getFirstClassDeclaration", "classDeclaration");
    if (firstClassDeclaration) {
      let classInfo = this.extractClassInfo(firstClassDeclaration, typeDeclaration);
      classesInfo.classes.push(classInfo);
      // this might be an Interface or Enum - so no class to parse
    }

    return classesInfo;
  },

  extractExpressionValue: function (content) {
    if (!content) {
      return null;
    }
    if (Object.prototype.hasOwnProperty.call(content, "image")) {
      return content.image;
    }

    let value = this.checkParticularChild(false, content, "extractExpressionValue", "expression");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "variableInitializer"); // Boolean constant
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "ternaryExpression");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "binaryExpression");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "unaryExpression");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "parenthesisExpression");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "lambdaExpression");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "primary");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "primaryPrefix");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "literal");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "StringLiteral");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "CharLiteral");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "integerLiteral");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "DecimalLiteral");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "FloatLiteral");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "floatingPointLiteral");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "booleanLiteral");
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "False"); // Boolean constant
    value = value || this.checkParticularChild(false, content, "extractExpressionValue", "True"); // Boolean constant

    if (!value) {
      // Check some tricky cases need specific logic
      let fqnDecl = this.checkParticularChild(false, content, "extractExpressionValue", "fqnOrRefType");
      if (fqnDecl) {
        // some fully qualified class name
        return this.extractFQNString(fqnDecl);
      }
      let arrayDecl = this.checkParticularChild(false, content, "extractExpressionValue", "elementValueArrayInitializer");
      if (arrayDecl) {
        // some array
        let arrayDisplayValue = [];
        let elements = this.checkParticularChildren(false, arrayDecl, "extractExpressionValue", "elementValueList", "elementValue");
        if (elements) {
          for (let ind=0; ind < elements.length; ind ++) {
            arrayDisplayValue.push(this.extractExpressionValue(elements[ind]));
          }
        }
        return arrayDisplayValue;
      }
      let arrayInitDecl = this.checkParticularChild(false, content, "extractExpressionValue", "arrayInitializer");
      if (arrayInitDecl) {
        // some array
        let arrayDisplayValue = [];
        let elements = this.checkParticularChildren(false, arrayInitDecl, "extractExpressionValue", "variableInitializerList");
        if (elements) {
          for (let ind = 0; ind < elements.length; ind++) {
            arrayDisplayValue.push(this.extractExpressionValue(elements[ind]));
          }
        }
        return arrayDisplayValue;
      }
      if (this.checkParticularChild(false, content, "extractExpressionValue", "newExpression")) {
        // is new Object() expression
        let classToNew = this.getParticularChildValue(false, content, "extractExpressionValue", "newExpression", "unqualifiedClassInstanceCreationExpression", "classOrInterfaceTypeToInstantiate", "Identifier");
        return "new " + (classToNew ? classToNew : "Object")+"(*)";
      }
      if (this.checkParticularChild(false, content, "extractExpressionValue", "Null")) {
        // null
        return "null";
      }
      if ( // ignore all these as not relevant for us
           this.checkParticularChild(false, content, "extractExpressionValue", "annotation")
        || this.checkParticularChild(false, content, "extractExpressionValue", "lambdaBody")
        || this.checkParticularChild(false, content, "extractExpressionValue", "castExpression")
      ) {
        // null
        return null;
      }
    }

    if (value && value["children"]) {
      return this.extractExpressionValue(value);
    }

    let valueOrContent = value;
    if (!valueOrContent) {
      valueOrContent = content;
    }

    if (Object.prototype.hasOwnProperty.call(valueOrContent, "image")) {
      return valueOrContent.image;
    }

    // If value is not parsable - raise error
    let props = [];
    for (var prop in valueOrContent.children) {
      if (Object.prototype.hasOwnProperty.call(valueOrContent.children, prop)) {
        props.push(prop);
      }
    }
    console.log(`[extractExpressionValue] failed to find expression value. Existing nodes:`, props);
    return null;
  },

  getIdentifier(identifierContainer, containerName) {
    if (containerName) {
      identifierContainer = this.checkParticularChild(false, identifierContainer, "getIdentifier", containerName);
    }
    if (!identifierContainer) {
      return null;
    }
    let identifier = this.checkParticularChild(true, identifierContainer, "getIdentifier", "Identifier");
    return identifier ? identifier.image : null;
  },

  extractAnnotationInfo(annotation) {
    let annotationInfo = {
      name: this.getIdentifier(annotation, "typeName")
    };

    annotationInfo.value = this.getParticularChildValue(false, annotation, "extractAnnotationInfo", "elementValue");
    if (annotationInfo.value &&  typeof annotationInfo.value === "string") {
      annotationInfo.value = annotationInfo.value.replace(/(^\"|\"$)/g,'');
    }

    return annotationInfo;
  },

  extractClassBodyInfo(classInfo, memberDeclaration) {
    let memberInfo = {
      kind: "unknown"
    };
    let methodDeclaration = this.checkParticularChild(false, memberDeclaration, "extractClassBodyInfo", "classMemberDeclaration", "methodDeclaration");
    if (methodDeclaration) {
      memberInfo.kind = "method";
      memberInfo.name = this.getParticularChildValue(false, methodDeclaration, "extractClassBodyInfo", "methodHeader", "methodDeclarator", "Identifier");
      memberInfo.annotations = this.extractAnnotationsInfo(methodDeclaration, "methodModifier");
      return memberInfo;
    }
    let fieldDeclaration = this.checkParticularChild(false, memberDeclaration, "extractClassBodyInfo", "classMemberDeclaration", "fieldDeclaration");
    if (fieldDeclaration) {
      memberInfo.kind = "field";
      let declarator = this.checkParticularChild(false, fieldDeclaration, "extractClassBodyInfo", "variableDeclaratorList", "variableDeclarator");
      if (declarator) {
        memberInfo.name = this.getParticularChildValue(false, declarator, "extractClassBodyInfo", "variableDeclaratorId", "Identifier");
        memberInfo.value = this.getParticularChildValue(false, declarator, "extractClassBodyInfo", "variableInitializer");
        if (memberInfo.value) {
          if (typeof memberInfo.value === 'string') {
            // Removing the surrounding " if a string
            memberInfo.value = memberInfo.value.replace(/(^\"|\"$)/g,'');
          }
        }
      }
      memberInfo.annotations = this.extractAnnotationsInfo(fieldDeclaration, "methodModifier");
      return memberInfo;
    }
    let firstChildName = Object.keys(memberDeclaration.children)[0];

    if ([
        "constructorDeclaration"
      , "instanceInitializer"
    ].includes(firstChildName)) {
      // ignore that - not needed
      return memberInfo;
    }
    if (memberDeclaration.name === 'classMemberDeclaration') {
        let firstMemberName = Object.keys(memberDeclaration.children)[0];
        if ([
          "classDeclaration"
          , 'Semicolon'
          , 'staticInitializer'
        ].includes(firstMemberName)) {
          // ignore that - not needed
          return memberInfo;
        } else {
          corUtil.warn(`Unknown kind of class member ${classInfo.className}`);
          return memberInfo;
        }
    }
    if (memberDeclaration.name === 'classBodyDeclaration') { // Subclass declaration - ignore
          // ignore that - not needed
          return memberInfo;
    }
    corUtil.warn(`Unknown kind of entity member ${classInfo.className}`);
    return memberInfo;
  },

  extractFQNString(fqnDecl) {
    let first = this.getParticularChildValue(false, fqnDecl, "extractFQNString", "fqnOrRefTypePartFirst", "fqnOrRefTypePartCommon", "Identifier");
    let second = this.getParticularChildValue(false, fqnDecl, "extractFQNString", "fqnOrRefTypePartRest", "fqnOrRefTypePartCommon", "Identifier");
    return first + "."+second;
  },

  getClassJavadoc(typeDeclaration, classInfo) {
    let javadoc = {};
    if (typeDeclaration && typeDeclaration.leadingComments && Array.isArray(typeDeclaration.leadingComments) && typeDeclaration.leadingComments.length > 0) {
      let javaDoc = typeDeclaration.leadingComments[0].image;

      let author = javaDoc.match(/@author\s+(.*)\s*\n/);
      if (author && author.length > 1) {
        javadoc.author = author["1"];
      }
      let since = javaDoc.match(/@since\s+(.*)\s*\n/);
      if (since && since.length > 1) {
        javadoc.since = since["1"];
      }
      let team = javaDoc.match(/@ScrumTeam\s+(.*)\s*\n/);
      if (team && team.length > 1) {
        javadoc.team = team["1"];
      }
    }
    return javadoc;
  },


  checkForAnnotations(annotations, elementInfo, description){
    if (annotations && annotations.length > 0){
      for(let i = 0; i < annotations.length; i++) {
        let annotation = annotations[i];
        if (annotation.name.endsWith("ScrumTeam")) {
          corUtil.addTagInfo(elementInfo.owners, annotation.value, 'ScrumTeam ' + description);
        }
        if (annotation.name.endsWith("TestLabels")) {
          corUtil.addTagInfo(elementInfo.labels, annotation.value, 'TestLabel ' + description);
        }
      }
    }
  },

  extractOwnershipInfo(info, content) {
    let javaOwn = {
      classInfo: {
        owners: [],
        labels: [],
        ownersPartial: [] // for example some of the methods are owned by a different team
      },
      methodsInfo: []
    };
    if (info.classes && info.classes.length > 0) {
      let classInfo = info.classes[0];
      this.checkForAnnotations(classInfo.annotations, javaOwn.classInfo, "class annotation");

      if (classInfo.javadoc && classInfo.javadoc.team) {
        corUtil.addTagInfo(javaOwn.classInfo.owners, classInfo.javadoc.team, "ScrumTeam javadoc");
      }
      if (classInfo.methods && classInfo.methods.length > 0) {
        for(let i=0; i < classInfo.methods.length; i++) {
          let method = classInfo.methods[i];
          let methodInfo = {
            name: method.name,
            owners: [],
            labels: []
          };
          javaOwn.methodsInfo.push(methodInfo);
          this.checkForAnnotations(method.annotations, methodInfo, "method annotation");
        }
      }

      this.classInfoPostprocessing(info, classInfo, javaOwn);
    }
    return javaOwn;
  },
  classInfoPostprocessing(info, classInfo, javaOwn) {
    // remove methods not starting with test
    let oldMethodsInfo = javaOwn.methodsInfo;
    javaOwn.methodsInfo = [];
    for (let methodIndex in oldMethodsInfo) {
      let methodInfo = oldMethodsInfo[methodIndex];
      let methodName = methodInfo.name;
      if (!methodName.startsWith("test")) {
        if (!javaOwn.ignoredMethods) {
          javaOwn.ignoredMethods = [];
        }
        javaOwn.ignoredMethods.push(methodName);
        continue;
      }
      javaOwn.methodsInfo.push(methodInfo);
      let labels = methodInfo.labels;
      for (let labelIndex in labels) {
        let labelInfo = labels[labelIndex];
        if (labelInfo.name.endsWith("IN_DEV")) {
          methodInfo.IN_DEV = true;
          if (!classInfo.partialIN_DEV) {
            javaOwn.classInfo.partialIN_DEV = [];
          }
          javaOwn.classInfo.partialIN_DEV.push(methodName);
        }
      }
    }

    // Copy method owners to the class.ownersPartial
    for (let methodIndex in javaOwn.methodsInfo) {
      corUtil.copyTags(javaOwn.methodsInfo[methodIndex].owners, javaOwn.classInfo.ownersPartial);
    }
    // check for IN_DEV labels in class or methods
    let labels = javaOwn.classInfo.labels;
    for (let labelIndex in labels) {
      let labelInfo = labels[labelIndex];
      if (labelInfo.name.endsWith("IN_DEV")) {
        javaOwn.classInfo.IN_DEV = true;
      }
    }
    for (let methodIndex in javaOwn.methodsInfo) {
      let methodInfo = javaOwn.methodsInfo[methodIndex];
      let methodName = methodInfo.name;
      let labels = methodInfo.labels;
      for (let labelIndex in javaOwn.classInfo.labels) {
        let labelInfo = javaOwn.classInfo.labels[labelIndex];
        if (labelInfo.name.endsWith("IN_DEV")) {
          methodInfo.IN_DEV = true;
          if (!classInfo.partialIN_DEV) {
            javaOwn.classInfo.partialIN_DEV = [];
          }
          javaOwn.classInfo.partialIN_DEV.push(methodName);
        }
      }
    }
  }
};


module.exports = javaParser;
